/* Reader — the blog, inside a window.
 *
 * The list and every post are read from the real pages, so blog.html and
 * posts/*.html stay the source of truth and keep working as ordinary URLs for
 * direct links and search. Nothing here duplicates the writing.
 */

(function () {
    const cache = new Map();

    function get(url) {
        if (cache.has(url)) return Promise.resolve(cache.get(url));
        return fetch(url)
            .then((r) => (r.ok ? r.text() : Promise.reject(new Error(r.status))))
            .then((html) => {
                const doc = new DOMParser().parseFromString(html, 'text/html');
                cache.set(url, doc);
                return doc;
            });
    }

    function fail(body, what) {
        body.innerHTML = '<div class="rd-pad"><p>Could not load ' + what + '.</p>' +
            '<p class="rd-note">If you are opening this page straight from the file system, ' +
            'the browser blocks these reads. Serving the folder over http fixes it.</p></div>';
    }

    /* ------------------------------------------------------------- list -- */

    function showList(body) {
        body.innerHTML = '<div class="rd-pad"><p class="rd-note">Loading…</p></div>';
        get('blog.html').then((doc) => {
            const posts = [...doc.querySelectorAll('.post')];
            if (!posts.length) return fail(body, 'the blog');

            body.innerHTML =
                '<div class="rd-head"><span class="rd-count">' + posts.length + ' posts</span></div>' +
                '<ul class="rd-list">' + posts.map((p) => {
                    const title = p.querySelector('.post-title');
                    const date = p.querySelector('.date');
                    const cat = p.querySelector('.category');
                    const link = p.querySelector('.read-more');
                    const exc = p.querySelector('.post-excerpt');
                    if (!title || !link) return '';
                    return '<li><button type="button" class="rd-item" data-post="' +
                        link.getAttribute('href') + '">' +
                        '<span class="rd-item-title">' + title.textContent + '</span>' +
                        '<span class="rd-item-meta">' + (date ? date.textContent : '') +
                        (cat ? ' · ' + cat.textContent : '') + '</span>' +
                        (exc ? '<span class="rd-item-exc">' + exc.textContent + '</span>' : '') +
                        '</button></li>';
                }).join('') + '</ul>';

            body.querySelectorAll('[data-post]').forEach((b) => {
                b.addEventListener('click', () => showPost(body, b.dataset.post));
            });
        }).catch(() => fail(body, 'the blog'));
    }

    /* ------------------------------------------------------------- post -- */

    function showPost(body, href) {
        body.scrollTop = 0;
        body.innerHTML = '<div class="rd-pad"><p class="rd-note">Loading…</p></div>';
        get(href).then((doc) => {
            const title = doc.querySelector('.post-title, h1');
            const content = doc.querySelector('.post-content');
            const date = doc.querySelector('.date');
            const cat = doc.querySelector('.category');
            if (!content) return fail(body, 'that post');

            body.innerHTML =
                '<div class="rd-head"><button type="button" class="rd-back">← All posts</button>' +
                '<a class="rd-open" href="' + href + '">Open page ↗</a></div>' +
                '<article class="rd-post">' +
                '<p class="rd-item-meta">' + (date ? date.textContent : '') +
                (cat ? ' · ' + cat.textContent : '') + '</p>' +
                '<h2>' + (title ? title.textContent : '') + '</h2>' +
                content.innerHTML + '</article>';

            body.scrollTop = 0;
            body.querySelector('.rd-back').addEventListener('click', () => showList(body));
        }).catch(() => fail(body, 'that post'));
    }

    window.jgReader = {
        openBlog() {
            if (!window.jgWindows) return;
            window.jgWindows.open({
                id: 'thoughts',
                title: 'Thoughts',
                width: 720,
                height: 560,
                mount: (body) => { body.classList.add('rd'); showList(body); }
            });
        },
        openPost(href, title) {
            if (!window.jgWindows) return;
            window.jgWindows.open({
                id: 'post:' + href,
                title: title || 'Post',
                width: 700,
                height: 560,
                mount: (body) => { body.classList.add('rd'); showPost(body, href); }
            });
        }
    };
})();
