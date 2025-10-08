document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('photoCanvas');
    const ctx = canvas.getContext('2d');
    const photoInput = document.getElementById('photo');
    const uploadBtn = document.getElementById('uploadBtn');
    // const downloadBtn = document.getElementById('downloadBtn');
    const uploadTitle = document.getElementById('uploadTitle');
    const photoInfo = document.getElementById('photoInfo');

    uploadBtn.addEventListener('click', function() {
        photoInput.click();
    });

    // downloadBtn.addEventListener('click', function() {
    //     const photoContainer = document.querySelector('.photo-container');
        
    //     html2canvas(photoContainer, {
    //         backgroundColor: null,
    //         scale: 2,
    //         logging: false,
    //         useCORS: true,
    //         allowTaint: true
    //     }).then(function(canvas) {
    //         canvas.toBlob(function(blob) {
    //             const url = URL.createObjectURL(blob);
    //             const link = document.createElement('a');
    //             link.download = 'photo-' + Date.now() + '.png';
    //             link.href = url;
    //             link.click();
    //             URL.revokeObjectURL(url);
    //         }, 'image/png', 1.0);
    //     });
    // });

    photoInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const isHEIF = file.type === 'image/heif' || 
                          file.type === 'image/heic' || 
                          file.name.toLowerCase().endsWith('.heic') || 
                          file.name.toLowerCase().endsWith('.heif');
            
            if (isHEIF) {
                heic2any({
                    blob: file,
                    toType: 'image/jpeg',
                    quality: 0.9
                })
                .then(function(convertedBlob) {
                    processImage(convertedBlob, file);
                })
                .catch(function(error) {
                    console.error('Erro ao converter HEIF:', error);
                    alert('Erro ao processar foto HEIF. Tente converter para JPEG primeiro.');
                });
            } else {
                processImage(file, file);
            }
        }
    });

    function processImage(imageBlob) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const isLandscape = img.width > img.height;
                
                let targetRatio = isLandscape ? 5 / 4 : 4 / 5;
                
                let sourceWidth, sourceHeight, sourceX, sourceY;
                const imgRatio = img.width / img.height;
                
                if (imgRatio > targetRatio) {
                    sourceHeight = img.height;
                    sourceWidth = img.height * targetRatio;
                    sourceX = (img.width - sourceWidth) / 2;
                    sourceY = 0;
                } else {
                    sourceWidth = img.width;
                    sourceHeight = img.width / targetRatio;
                    sourceX = 0;
                    sourceY = (img.height - sourceHeight) / 2;
                }
                
                const maxSize = 800;
                let canvasWidth, canvasHeight;
                
                if (isLandscape) {
                    canvasWidth = maxSize;
                    canvasHeight = maxSize * (4 / 5);
                } else {
                    canvasHeight = maxSize;
                    canvasWidth = maxSize * (4 / 5);
                }
                
                canvas.width = canvasWidth;
                canvas.height = canvasHeight;

                ctx.drawImage(
                    img,
                    sourceX, sourceY, sourceWidth, sourceHeight,
                    0, 0, canvasWidth, canvasHeight
                );

                addVignetteEffect(ctx, canvasWidth, canvasHeight);

                photoInfo.style.display = 'flex';
                uploadTitle.innerHTML = 'Tire print e recorte a imagem'
                extractExifData(img);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(imageBlob);
    }

    function addVignetteEffect(ctx, width, height) {
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, Math.min(width, height) * 0.3,
            width / 2, height / 2, Math.max(width, height) * 0.8
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    function extractExifData(img) {
        EXIF.getData(img, function() {
            const make = EXIF.getTag(this, "Make");
            const model = EXIF.getTag(this, "Model");
            const focalLength = EXIF.getTag(this, "FocalLength");
            const fNumber = EXIF.getTag(this, "FNumber");
            const exposureTime = EXIF.getTag(this, "ExposureTime");
            const iso = EXIF.getTag(this, "ISOSpeedRatings");
            
            const hasAnyExif = make || model || focalLength || fNumber || exposureTime || iso;
            
            if (!hasAnyExif) {
                document.getElementById('photoInfo').style.display = 'none';
                return;
            }

            if (model) {
                document.getElementById('cameraModel').textContent = model;
            } else {
                document.getElementById('cameraModel').textContent = '';
            }

            if (make) {
                document.getElementById('cameraBrand').textContent = make.toUpperCase();
            } else {
                document.getElementById('cameraBrand').textContent = '';
            }

            if (focalLength) {
                const focalLengthMm = Math.round(focalLength);
                document.getElementById('focalLength').textContent = focalLengthMm + 'mm';
            } else {
                document.getElementById('focalLength').textContent = '';
            }

            if (fNumber) {
                document.getElementById('aperture').textContent = 'f/' + fNumber.toFixed(1);
            } else {
                document.getElementById('aperture').textContent = '';
            }

            if (exposureTime) {
                let shutterSpeedText;
                if (exposureTime < 1) {
                    shutterSpeedText = '1/' + Math.round(1 / exposureTime) + 's';
                } else {
                    shutterSpeedText = exposureTime.toFixed(1) + 's';
                }
                document.getElementById('shutterSpeed').textContent = shutterSpeedText;
            } else {
                document.getElementById('shutterSpeed').textContent = '';
            }

            if (iso) {
                document.getElementById('iso').textContent = 'ISO' + iso;
            } else {
                document.getElementById('iso').textContent = '';
            }
        });
    }

});
