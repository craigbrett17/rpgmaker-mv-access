const { JSDOM } = require('jsdom');
const { initializeSpies, destroySpies } = require('./SpySetup');

describe('Screen Reader Access plugin', () => {
    let document, dom;

    const loadPlugin = () => require('../../src/ScreenReaderAccess');

    describe('Given a blank new window', () => {
        beforeAll(() => {
            dom = new JSDOM();
            document = global.document = dom.window.document;

            initializeSpies();
        });

        afterAll(() => {
            dom.window.close();
            delete global.document;
            destroySpies();
            // delete the cached require for the plugin load
            delete require.cache[require.resolve('../../src/ScreenReaderAccess')];
        });

        describe('And that it loads the plugin', () => {
            beforeEach(() => {
                loadPlugin();
            });

            it('Then it should put the sr elements on the body', () => {
                expect(document.querySelector('#sr-announce')).toBeTruthy();
            });
        });
    });
});