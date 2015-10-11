function getOutputScale(ctx) {
    var devicePixelRatio = window.devicePixelRatio || 1;
    var backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
        ctx.mozBackingStorePixelRatio ||
        ctx.msBackingStorePixelRatio ||
        ctx.oBackingStorePixelRatio ||
        ctx.backingStorePixelRatio || 1;
    var pixelRatio = devicePixelRatio / backingStoreRatio;
    return {
        sx: pixelRatio,
        sy: pixelRatio,
        scaled: pixelRatio !== 1
    };
}

function renderPDF(options) {
    var canvasContainer;
    canvasContainer = document.getElementById(options.containerId);
    canvasContainer.style.width = options.width + 'px';

    function renderPage(page) {
        var viewport, scale, canvas, ctx, outputScale, textLayerDiv, textLayer, canvasWrapper;

        canvasWrapper = document.createElement('div');
        canvasWrapper.style.width = canvasContainer.style.width;
        canvasWrapper.style.position = 'relative';
        canvasContainer.appendChild(canvasWrapper);

        // adjust scale ratio to desired width
        viewport = page.getViewport(1);
        scale = options.width / viewport.width;
        viewport = page.getViewport(scale);

        // create canvas
        canvas = document.createElement('canvas');
        canvasWrapper.appendChild(canvas);

        // scale canvas
        ctx = canvas.getContext('2d');
        outputScale = getOutputScale(ctx);

        canvas.width = (Math.floor(viewport.width) * outputScale.sx) | 0;
        canvas.height = (Math.floor(viewport.height) * outputScale.sy) | 0;
        canvas.style.width = Math.floor(viewport.width) + 'px';
        canvas.style.height = Math.floor(viewport.height) + 'px';
        canvas._viewport = viewport;

        // support text selection
        textLayerDiv = document.createElement('div');
        textLayerDiv.className = 'textLayer';
        textLayerDiv.style.width = canvas.style.width;
        textLayerDiv.style.height = canvas.style.height;

        canvasWrapper.appendChild(textLayerDiv);

        textLayer = new TextLayerBuilder({
            textLayerDiv: textLayerDiv,
            pageIndex: page.id - 1,
            viewport: viewport
        });

        if (outputScale.scaled) {
            ctx._transformMatrix = [outputScale.sx, 0, 0, outputScale.sy, 0, 0];
            ctx.scale(outputScale.sx, outputScale.sy);
        }

        // render pdf page
        page.render({
            canvasContext: ctx,
            viewport: viewport
        }).then(function() {
            page.getTextContent().then(
                function textContentResolved(textContent) {
                    textLayer.setTextContent(textContent);
                    textLayer.render(200);
                }
            );
        });
    }

    function renderPages(pdfDoc) {
        for (var num = 1; num <= pdfDoc.numPages; num++) {
            pdfDoc.getPage(num).then(renderPage);
        }
        NProgress.done();
    }

    NProgress.start();
    PDFJS.getDocument(options.url).then(renderPages);
}

renderPDF({
    url: 'TINYpulse_2015_Best_Industry_Ranking_Report.pdf',
    containerId: 'holder',
    width: 960
});
