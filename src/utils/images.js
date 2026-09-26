function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo leer la imagen'));
    img.src = src;
  });
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

async function resize(src, maxSize, quality) {
  const img = await loadImage(src);
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', quality);
}

/** Comprime una foto subida por el usuario (JPEG, máx. 1280 px). */
export async function compressImage(file) {
  if (!file.type.startsWith('image/')) throw new Error(`"${file.name}" no es una imagen`);
  return resize(await readAsDataURL(file), 1280, 0.75);
}

/** Genera la miniatura (portada) que se muestra en el inventario. */
export async function makeThumbnail(src) {
  if (src.startsWith('data:image/svg')) return src;
  return resize(src, 520, 0.7);
}
