// Hemoglobina para imprimir en 3D: convierte la cadena (un punto por pieza) en un tubo cerrado y lo guarda en STL.
// No toca la página: se usa igual en el navegador y en las pruebas (node --test).
(function (root) {
  'use strict';
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    scale = (a, k) => [a[0] * k, a[1] * k, a[2] * k],
    dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross = (a, b) => [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ],
    unit = a => scale(a, 1 / (Math.hypot(...a) || 1));

  // Curva suave (Catmull-Rom) que pasa por todas las posiciones medidas, como en el visor.
  function smooth(points, steps = 4) {
    const out = [];
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)],
        p1 = points[i],
        p2 = points[i + 1],
        p3 = points[Math.min(points.length - 1, i + 2)];
      for (let j = 0; j < steps; j++) {
        const t = j / steps,
          t2 = t * t,
          t3 = t2 * t;
        out.push(
          [0, 1, 2].map(
            a =>
              0.5 *
              (2 * p1[a] +
                (-p0[a] + p2[a]) * t +
                (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * t2 +
                (-p0[a] + 3 * p1[a] - 3 * p2[a] + p3[a]) * t3),
          ),
        );
      }
    }
    out.push(points[points.length - 1].slice());
    return out;
  }
  // Tubo cerrado alrededor de un camino: anillos de «sides» puntos y una tapa en cada punta.
  // Los anillos se orientan sin retorcerse (transporte paralelo) para que el tubo no se estrangule.
  function tube(path, radius = 1.2, sides = 10) {
    const vertices = [],
      triangles = [],
      n = path.length;
    let normal = null;
    for (let i = 0; i < n; i++) {
      const tangent = unit(sub(path[Math.min(n - 1, i + 1)], path[Math.max(0, i - 1)]));
      if (!normal) {
        const helper = Math.abs(tangent[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
        normal = unit(cross(tangent, helper));
      } else normal = unit(sub(normal, scale(tangent, dot(normal, tangent))));
      const binormal = cross(tangent, normal);
      for (let k = 0; k < sides; k++) {
        const a = (k / sides) * Math.PI * 2;
        vertices.push(
          add(
            path[i],
            add(scale(normal, Math.cos(a) * radius), scale(binormal, Math.sin(a) * radius)),
          ),
        );
      }
    }
    for (let i = 0; i < n - 1; i++)
      for (let k = 0; k < sides; k++) {
        const a = i * sides + k,
          b = i * sides + ((k + 1) % sides),
          c = a + sides,
          d = b + sides;
        triangles.push([a, b, d], [a, d, c]);
      }
    const start = vertices.push(path[0].slice()) - 1,
      end = vertices.push(path[n - 1].slice()) - 1,
      last = (n - 1) * sides;
    for (let k = 0; k < sides; k++) {
      const next = (k + 1) % sides;
      triangles.push([start, next, k], [end, last + k, last + next]);
    }
    return { vertices, triangles };
  }
  // Esfera cerrada (para marcar la pieza que cambió).
  function sphere(center, radius = 2.4, rings = 10, segments = 16) {
    const vertices = [center.map((v, i) => v + (i === 2 ? radius : 0))],
      triangles = [];
    for (let r = 1; r < rings; r++) {
      const phi = (r / rings) * Math.PI;
      for (let s = 0; s < segments; s++) {
        const theta = (s / segments) * Math.PI * 2;
        vertices.push([
          center[0] + radius * Math.sin(phi) * Math.cos(theta),
          center[1] + radius * Math.sin(phi) * Math.sin(theta),
          center[2] + radius * Math.cos(phi),
        ]);
      }
    }
    const bottom = vertices.push(center.map((v, i) => v - (i === 2 ? radius : 0))) - 1,
      at = (r, s) => 1 + (r - 1) * segments + (s % segments);
    for (let s = 0; s < segments; s++) {
      triangles.push([0, at(1, s), at(1, s + 1)]);
      for (let r = 1; r < rings - 1; r++)
        triangles.push(
          [at(r, s), at(r + 1, s), at(r + 1, s + 1)],
          [at(r, s), at(r + 1, s + 1), at(r, s + 1)],
        );
      triangles.push([bottom, at(rings - 1, s + 1), at(rings - 1, s)]);
    }
    return { vertices, triangles };
  }
  // Arma el modelo de una cadena: la escala pasa de angstroms a milímetros (2 mm por angstrom).
  function proteinMeshes(chain, { mark = 0, mm = 2 } = {}) {
    const pts = chain.map(p => [p.x * mm, p.y * mm, p.z * mm]),
      meshes = [tube(smooth(pts), 1.2 * mm)];
    if (mark >= 1 && mark <= chain.length) meshes.push(sphere(pts[mark - 1], 2.2 * mm));
    return meshes;
  }
  // STL binario: encabezado de 80 bytes, cantidad de triángulos y, por cada uno, su normal y sus 3 vértices.
  function toSTL(meshes, title = 'Hemoglobina beta - Genoma LAB') {
    const count = meshes.reduce((n, m) => n + m.triangles.length, 0),
      buffer = new ArrayBuffer(84 + count * 50),
      view = new DataView(buffer);
    for (let i = 0; i < Math.min(80, title.length); i++)
      view.setUint8(i, title.charCodeAt(i) & 0x7f);
    view.setUint32(80, count, true);
    let offset = 84;
    // El modelo se apoya sobre la cama de la impresora: lo más bajo queda en z = 0.
    const minZ = Math.min(...meshes.flatMap(m => m.vertices.map(v => v[2])));
    for (const { vertices, triangles } of meshes)
      for (const [a, b, c] of triangles) {
        const A = vertices[a],
          B = vertices[b],
          C = vertices[c],
          normal = unit(cross(sub(B, A), sub(C, A)));
        for (const v of [normal, A, B, C]) {
          const z = v === normal ? v[2] : v[2] - minZ;
          view.setFloat32(offset, v[0], true);
          view.setFloat32(offset + 4, v[1], true);
          view.setFloat32(offset + 8, z, true);
          offset += 12;
        }
        offset += 2;
      }
    return buffer;
  }
  // Volumen con signo de una malla cerrada: es positivo si todas las caras miran hacia afuera.
  function signedVolume({ vertices, triangles }) {
    return triangles.reduce(
      (sum, [a, b, c]) => sum + dot(vertices[a], cross(vertices[b], vertices[c])) / 6,
      0,
    );
  }
  const api = { smooth, tube, sphere, proteinMeshes, toSTL, signedVolume };
  if (typeof module !== 'undefined') module.exports = api;
  root.STL = api;
})(globalThis);
