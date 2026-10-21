// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 浏览器文件工具：上传前压缩图片、转 Base64、下载文本文件。
export function compressImage(file, maxSide = 1024, quality = 0.75) {
  return new Promise(function (resolve, reject) {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = function () {
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        function (blob) {
          URL.revokeObjectURL(objectUrl);
          if (blob) resolve(blob);
          else reject(new Error("图片压缩失败"));
        },
        "image/jpeg",
        quality
      );
    };
    image.onerror = function () {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("图片读取失败"));
    };
    image.src = objectUrl;
  });
}

export function blobToBase64(blob) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();
    reader.onload = function (event) {
      const result = String(event.target?.result || "");
      resolve(result.split(",")[1] || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function downloadTextFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType || "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
