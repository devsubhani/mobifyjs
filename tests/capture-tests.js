require(["mobifyjs/utils", "mobifyjs/capture"], function(Utils, Capture) {
    QUnit.start();
    module("Capture");
    // Test disabling attributes that cause resource loading
    test("disable", function() {
        var html = $("#disable-test-fixture").text();
        var expectedHtml = "<html>\
\n<head>\
\n    <link x-href=\"/path/to/stylesheet.css\">\
\n    <style media=\"mobify-media\" x-media=\"query\"></style>\
\n</head>\
\n<body>\
\n    <img x-src=\"/path/to/image.png\"></img>\
\n    <iframe x-src=\"/path/to/page.html\"></iframe>\
\n</body>\
\n</html>\
\n"

        // Needed to pass tests on iOS 4.3 on iPad
        if (/ip(hone|ad).*4_/i.test(navigator.userAgent)){
            expectedHtml = "\n" + expectedHtml
        }

        equal(Capture.disable(html, "x-"), expectedHtml, "Passed!" );
    });

    // Test enabling attributes that cause resource loading
    test("enable", function() {
        var html = $("#enable-test-fixture").text();
        var expectedHtml = "<html>\
\n<head>\
\n    <link href=\"/path/to/stylesheet.css\">\
\n    <style media=\"query\"></style>\
\n</head>\
\n<body>\
\n\
\n    <img src=\"/path/to/image.png\"></img>\
\n    <iframe src=\"/path/to/page.html\"></iframe>\
\n</body>\
\n</html>\
\n"
        // Needed to pass tests on iOS 4.3 on iPad/iPhone
        if (/ip(hone|ad).*4_/i.test(navigator.userAgent)){
            expectedHtml = "\n" + expectedHtml
        }

        ok(Capture.enable(html, "x-"), expectedHtml, "Passed!" );
    });

    test("openTag", function(){
        var element = $("#foo-element");
        var openTag = Capture.openTag(element);
        ok((openTag === "<div id=\"foo-element\" foo=\"bar\">") || openTag === "<div foo=\"bar\" id=\"foo-element\">")
    });

    asyncTest("createDocumentFromSource", function(){
        var iframe = $("<iframe>", {id: "plaintext-example"});
        iframe.attr("src", "/tests/fixtures/plaintext-example.html")
        iframe.load(function(){
            var doc = this.contentDocument;

            // We remove the webdriver attribute set when running tests on selenium (typically done through SauceLabs)
            var htmlEl = doc.getElementsByTagName("html")[0].removeAttribute("webdriver")

            Capture.init(function(capture) {
                var capturedDoc = capture.capturedDoc;

                var expectedHtml = "<!DOCTYPE HTML><html class=\"testclass\"><head foo=\"bar\">\
\n    \
\n    <link rel=\"stylesheet\" href=\"/path/to/stylesheet.css\">\
\n\
\n</head><body bar=\"baz\">\
\n    <!-- comment with <head> -->\
\n    <p>Plaintext example page!</p>\
\n    <script src=\"/path/to/script.js\"><\/script>\
\n\
\n\
\n\
\n</body></html>";
                var html = capture.enabledHTMLString(capturedDoc);
                equal(html, expectedHtml, "Passed!");
                start();
            }, doc);
        });
        $("#qunit-fixture").append(iframe);
    });

    // Shared expected output for the next two tests
    var expectedCapture = {
        doctype: "<!DOCTYPE HTML>",
        htmlOpenTag: "<html class=\"testclass\">",
        headOpenTag: "<head foo=\"bar\">",
        bodyOpenTag: "<body bar=\"baz\">",
        headContent: "\n    \n    <link rel=\"stylesheet\" href=\"/path/to/stylesheet.css\">\n</head>\n",
        bodyContent: "\n    <!-- comment with <head> -->\n    <p>Plaintext example page!</p>\n    <script src=\"/path/to/script.js\"><\/script>\n</body>\n</html>\n\n"
    }

    asyncTest("createDocumentFragmentsStrings - below head tag", function(){
        var iframe = $("<iframe>", {id: "plaintext-example9"});
        iframe.attr("src", "/tests/fixtures/plaintext-example.html")
        iframe.load(function(){
            var self2 = this;

            var doc = self2.contentDocument;

            // We remove the webdriver attribute set when running tests on selenium (typically done through SauceLabs)
            var htmlEl = doc.getElementsByTagName("html")[0].removeAttribute("webdriver")

            var capture = Capture.createDocumentFragmentsStrings(doc);
            // We're not testing the all function here, let's remove it
            delete capture.all;
            deepEqual(capture, expectedCapture)
            start();
        });
        $("#qunit-fixture").append(iframe);
    });

    asyncTest("createDocumentFragmentsStrings - above head tag", function(){
        var iframe = $("<iframe>", {id: "plaintext-example2"});
        iframe.attr("src", "/tests/fixtures/plaintext-above-head-example.html")
        iframe.load(function(){
            var self = this;
            setTimeout(function() {
            var doc = self.contentDocument;

            // We remove the webdriver attribute set when running tests on selenium (typically done through SauceLabs)
            var htmlEl = doc.getElementsByTagName("html")[0].removeAttribute("webdriver")

            var capture = Capture.createDocumentFragmentsStrings(doc);
            // We're not testing the all function here, let's remove it
            delete capture.all;
            deepEqual(capture, expectedCapture)
            start();
        }, 1000);
        });
        $("#qunit-fixture").append(iframe);
    });

    asyncTest("createDocumentFragmentsStrings - body in comment", function(){
        var iframe = $("<iframe>", {id: "plaintext-example3"});
        iframe.attr("src", "/tests/fixtures/plaintext-above-head-example.html")
        iframe.load(function(){
            var doc = this.contentDocument;

            // We remove the webdriver attribute set when running tests on selenium (typically done through SauceLabs)
            var htmlEl = doc.getElementsByTagName("html")[0].removeAttribute("webdriver")

            var capture = Capture.createDocumentFragmentsStrings(doc);
            // We're not testing the all function here, let's remove it
            delete capture.all;
            deepEqual(capture, expectedCapture)
            start();
        });
        $("#qunit-fixture").append(iframe);
    });

    asyncTest("createDocumentFragmentsStrings - malformed markup", function(){
        var iframe = $("<iframe>", {id: "plaintext-example4"});
        iframe.attr("src", "/tests/fixtures/plaintext-malformed-markup-example.html")
        iframe.load(function(){
            var doc = this.contentDocument;

            // We remove the webdriver attribute set when running tests on selenium (typically done through SauceLabs)
            var htmlEl = doc.getElementsByTagName("html")[0].removeAttribute("webdriver")

            var expectedCaptureClone = Utils.clone(expectedCapture);
            expectedCaptureClone.bodyOpenTag = "<body foo=\"bar>\" bar='>baz'>";
            expectedCaptureClone.headOpenTag = "<head foo=\"bar>\" bar='>baz'>";
            var capture = Capture.createDocumentFragmentsStrings(doc);
            // We're not testing the all function here, let's remove it
            delete capture.all;
            deepEqual(capture, expectedCaptureClone)
            start();
        });
        $("#qunit-fixture").append(iframe);
    });

    asyncTest("createDocumentFragmentsStrings - no end head tag", function(){
        var iframe = $("<iframe>", {id: "plaintext-example5"});
        iframe.attr("src", "/tests/fixtures/plaintext-no-end-head-example.html")
        iframe.load(function(){
            var doc = this.contentDocument;

            // We remove the webdriver attribute set when running tests on selenium (typically done through SauceLabs)
            var htmlEl = doc.getElementsByTagName("html")[0].removeAttribute("webdriver")
            var expectedCaptureClone = Utils.clone(expectedCapture);
            expectedCaptureClone.headContent = "\n    \n    <link rel=\"stylesheet\" href=\"/path/to/stylesheet.css\">\n"
            var capture = Capture.createDocumentFragmentsStrings(doc);
            // We're not testing the all function here, let's remove it
            delete capture.all;
            deepEqual(capture, expectedCaptureClone)
            start();
        });
        $("#qunit-fixture").append(iframe);
    });

    /**
     * Ensure rendering executes scripts in order.
     */
    asyncTest("scriptsCorrectOrder", function() {
        var opts = {
            id: "script-order-test",
            src: "/tests/fixtures/blank-example.html"
        };
        var $iframe = $("<iframe>", opts);
        var el = $iframe[0];

        var html = '<html><head></head>\
                    <body>\
                    <script>var verify=[1];<\/script>\
                    <script x-src="/tests/resources/bigscript.js"><\/script>\
                    <script>verify.push(3);<\/script>\
                    <script x-src="/tests/resources/smallscript.js"><\/script>\
                    <script>verify.push(5);<\/script>\
                    <script>parent.postMessage(verify.join(), "*");<\/script>\
                    </body></html>';

        window.addEventListener("message", function onMessage(event) {
            if (event.source != el.contentWindow) return;
            window.removeEventListener("message", onMessage, false);
            equal(event.data, "1,2,3,4,5");
            start();
        }, false);

        $iframe.one('load', function onLoad() {
            Capture.init(function(capture) {
                capture.render(html);
            }, this.contentDocument);
        });

        $("#qunit-fixture").append($iframe);
    });

    test("ios8_0ScrollFix", function() {
        var html =
            "<html>" +
            "<head>" +
            "  <title>Scroll Fix Test</title>" +
            "</head>" +
            "<body style='font-size: 13px' class='x-test'>" +
            "  <ul>" +
            "    <li>Woohoo</li>" +
            "  </ul>" +
            "</body>" +
            "</html>";

        html = Capture.ios8_0ScrollFix(html);
        
        ok(html.indexOf('font-size: 13px') !== -1,
            '`font-size: 13px` on the body tag is still present');
        ok(html.indexOf('display: none') !== -1,
            '`display: none` was set on the body tag');
        ok(html.indexOf("document.body.style.display = '';") !== -1,
            'there is a script to show the body');
        ok(html.indexOf('x-test') !== -1,
            '`x-test` body class tag is still present');
    });

    if (window.requestAnimationFrame) {
        asyncTest("iOS 8.0 scroll fix is applied when rendering", function() {
            var opts = {
                id: "ios-8_0-render-scroll-fix",
                src: "/tests/fixtures/plaintext-display-none-body.html"
            };
            var $iframe = $("<iframe>", opts);
            var el = $iframe[0];

            $iframe.one('load', function onLoad() {
                var self = this;

                Capture.init(function(capture) {
                    capture.render(null, {forceIOS8_0ScrollFix: true});

                    var iid = setInterval(function() {
                        if (self.contentDocument.querySelectorAll('plaintext').length == 0 &&
                                self.contentDocument.body.style.display == '') {
                            ok(true, 'document was shown');
                            clearInterval(iid);
                            start();
                        }
                    }, 100);
                }, this.contentDocument);
            });

            $("#qunit-fixture").append($iframe);
        });

        asyncTest("iOS 8.0 scroll fix is applied on restore", function(){
            var opts = {
                id: "ios-8_0-restore-scroll-fix",
                src: "/tests/fixtures/plaintext-display-none-body.html"
            };
            var $iframe = $("<iframe>", opts);
            var el = $iframe[0];

            $iframe.one('load', function onLoad() {
                var self = this;

                Capture.init(function(capture) {
                    capture.restore(null, {forceIOS8_0ScrollFix: true});

                    var iid = setInterval(function() {
                        if (self.contentDocument.querySelectorAll('plaintext').length == 0 &&
                                self.contentDocument.body.style.display == '') {
                            ok(true, 'document was shown');
                            clearInterval(iid);
                            start();
                        }
                    }, 100);
                }, this.contentDocument);
            });

            $("#qunit-fixture").append($iframe);
        });
    }

    test("cloneAttributes", function(){
        var el = document.createElement("div");
        Capture.cloneAttributes("<div class=\"test1 test2\"></div>", el);

        equal(el.className, "test1 test2");

        // Regression test cases for messed up attributes

        // Extra stray " character
        Capture.cloneAttributes("<div class=\"\"test1 test2\"></div>", el);

        equal(el.className, "");

        // No space between div and class attribute
        Capture.cloneAttributes("<divclass=\"\"test1 test2\"></div>", el);

        equal(el.className, "");

    });


    test("removeCloseEndTagsAtEndOfString", function(){
        var html = "</div><div>";
        equal(Capture.removeClosingTagsAtEndOfString(html), html);

        var html = "<html><head>\n</head>\n<body><h1></h1></body ></html>";
        var expectedHtml = "<html><head>\n</head>\n<body><h1>";
        equal(Capture.removeClosingTagsAtEndOfString(html), expectedHtml);
    })

    test("removeTargetSelf", function(){
        var html = "<a href='' target=\"_self\" target='_self'>";
        var expectedHtml = "<a href=''  >";
        equal(Capture.removeTargetSelf(html), expectedHtml);
    })

    /**
     * Ensure the complete document is captured.
     */
    asyncTest("capture captures the complete document", 0, function() {
        var opts = {
            id: "capture-complete",
            src: "/tests/fixtures/split.html"
        };
        var $iframe = $("<iframe>", opts);
        var el = $iframe[0];

        // Begin capturing on message. Restoring sends "complete".
        $(window).on("message", function onMessage(event) {
            event = event.originalEvent;
            if (event.source != el.contentWindow) return;
            $(window).unbind("message", onMessage);
            start();
        });

        $("#qunit-fixture").append($iframe);
    });

    /* 
     * Ensure that the mobify library is re-inserted into the
     * document, as well that the main function is inserted.
     */
    asyncTest("mobify scripts are re-inserted", function() {
        var opts = {
            src: "/tests/fixtures/mobify-library-example.html"
        };
        var $iframe = $("<iframe>", opts);
        var el = $iframe[0];

        window.addEventListener("message", function onMessage(event) {
            if (event.source != el.contentWindow) return;
            window.removeEventListener("message", onMessage, false);
            ok(el.contentDocument.getElementById('mobify-js'));
            ok(el.contentDocument.getElementById('main-executable'));
            start();
        }, false);

        $("#qunit-fixture").append($iframe);
    });

    /* 
     * Most browsers create a new global javascript namespace in the new document, 
     * except webkit, which preserves the namespace as it was before the call to 
     * document.open(). We reinject the library to ensure Mobify can be used
     * after the namespace is cleared.
     */
    asyncTest("mobify survives flood", function() {
        var opts = {
            id: "flood-test",
            src: "/tests/fixtures/mobify-library-example.html"
        };
        var $iframe = $("<iframe>", opts);
        var el = $iframe[0];

        window.addEventListener("message", function onMessage(event) {
            if (event.source != el.contentWindow) return;
            window.removeEventListener("message", onMessage, false);
            ok(el.contentWindow.Mobify);
            start();
        }, false);

        $("#qunit-fixture").append($iframe);
    });

    /**
     * Ensure that no meta tags get added to the document. This is a
     * regression test to make sure meta tags within noscript tags
     * do not get moved into the "head" in older browsers (Safari 4/5)
     */
    asyncTest("meta tags don't get moved into head", function() {
        var opts = {
            src: "/tests/fixtures/meta.html"
        };
        var $iframe = $("<iframe>", opts);
        var el = $iframe[0];

        window.addEventListener("message", function onMessage(event) {
            if (event.source != el.contentWindow) return;
            window.removeEventListener("message", onMessage, false);
            // Make sure that there are no meta tags in the document at all
            equal(el.contentDocument.getElementsByTagName('meta').length, 0, "Meta tags moved into the head are removed");
            start();
        }, false);

        $("#qunit-fixture").append($iframe);
    });

    asyncTest("Capture.restore", function(){
        var $iframe = $("<iframe>", {id: "plaintext-example201", src: "/tests/fixtures/plaintext-restore-example.html"});
        var el = $iframe[0];  

        var expectedHTML = "<!DOCTYPE HTML><html class=\"testclass\"><head foo=\"bar\"><script>parent.postMessage(\"done!\", \"*\");<\/script>\
\n    \
\n</head>\
\n<body bar=\"baz\">\
\n    <!-- comment with <head> -->\
\n    <p>Plaintext example page!</p>\
\n    <script src=\"/path/to/script.js\"><\/script></body></html>";

        window.addEventListener("message", function onMessage(event) {
            if (event.source != el.contentWindow) return;
            window.removeEventListener("message", onMessage, false);
            var doc = el.contentDocument;
            // Make sure that there are no meta tags in the document at all
            equal(Utils.getDoctype(doc) + Utils.outerHTML(doc.documentElement), expectedHTML, "HTML Restored to original state + injected script");
            start();
        }, false);

        $iframe.one('load', function(){
            var doc = this.contentDocument;

            // We remove the webdriver attribute set when running tests on selenium (typically done through SauceLabs)
            var htmlEl = doc.getElementsByTagName("html")[0].removeAttribute("webdriver")

            Capture.init(function(capture) {
                capture.restore('<script>parent.postMessage("done!", "*");<\/script>');
            }, doc);
        });
        $("#qunit-fixture").append($iframe);
    });
});