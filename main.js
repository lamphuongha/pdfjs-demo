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

    function renderPage(page) {
        var viewport, scale, canvasContainer, canvas, ctx, outputScale;

        // set width of container
        canvasContainer = document.getElementById(options.containerId);
        canvasContainer.style.width = options.width + 'px';

        // adjust scale ratio to desired width
        viewport = page.getViewport(1);
        scale = options.width / viewport.width;
        viewport = page.getViewport(scale);

        // create canvas
        canvas = document.createElement('canvas');
        canvasContainer.appendChild(canvas);

        // scale canvas
        ctx = canvas.getContext('2d');
        outputScale = getOutputScale(ctx);

        canvas.width = (Math.floor(viewport.width) * outputScale.sx) | 0;
        canvas.height = (Math.floor(viewport.height) * outputScale.sy) | 0;
        canvas.style.width = Math.floor(viewport.width) + 'px';
        canvas.style.height = Math.floor(viewport.height) + 'px';
        canvas._viewport = viewport;

        if (outputScale.scaled) {
            ctx._transformMatrix = [outputScale.sx, 0, 0, outputScale.sy, 0, 0];
            ctx.scale(outputScale.sx, outputScale.sy);
        }

        // render pdf page
        page.render({
            canvasContext: ctx,
            viewport: viewport
        });
    }

    function renderPages(pdfDoc) {
        for (var num = 1; num <= pdfDoc.numPages; num++) {
            pdfDoc.getPage(num).then(renderPage);
        }
        NProgress.done();
    }

    PDFJS.disableWorker = true;

    NProgress.start();
    PDFJS.getDocument(options.url).then(renderPages);
}

renderPDF({
    url: 'TINYpulse_2015_Best_Industry_Ranking_Report.pdf',
    containerId: 'holder',
    width: 960
});
