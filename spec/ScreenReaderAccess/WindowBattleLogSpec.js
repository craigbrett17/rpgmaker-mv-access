const { JSDOM } = require('jsdom');
const { initializeSpies, destroySpies } = require('./SpySetup')

describe('Screen Reader Access plugin', () => {
    let document, dom;
    let windowBattleLog;
    let addTextCallSpy;

    const loadPlugin = () => require('../../src/ScreenReaderAccess');
    const getAnnounceOutput = () => document.getElementById('sr-announce').innerText;

    describe('Given a blank new window', () => {
        beforeAll(() => {
            dom = new JSDOM();
            document = global.document = dom.window.document;

            // spy on the objects we monkeypatch
            initializeSpies();
            addTextCallSpy = jasmine.createSpy('Window_BattleLog.addText.call')
            windowBattleLog = {
                addText: jasmine.createSpy('Window_BattleLog.addText', { call: addTextCallSpy }),
            }
            global.Window_BattleLog = { prototype: windowBattleLog };
        });

        afterAll(() => {
            dom.window.close();
            delete global.document;
            destroySpies();
            // delete the cached require for the plugin load
            delete require.cache[require.resolve('../../src/ScreenReaderAccess')];
        });

        describe('And the plugin is loaded', () => {
            beforeAll(() => {
                loadPlugin();
            });

            describe('And that a battle log message is added', () => {
                afterEach(() => {
                    addTextCallSpy.calls.reset();
                });
                
                it('Then it should call through to the original engine code', () => {
                    Window_BattleLog.prototype.addText("Hiya");

                    // Assert that the spy was called
                    expect(addTextCallSpy).toHaveBeenCalledOnceWith(jasmine.any(Object), "Hiya");
                });

                it('Then it should output the battle log text', () => {
                    Window_BattleLog.prototype.addText("Ryu uses Hadouken!");

                    const output = getAnnounceOutput();
                    expect(output).toBe("Ryu uses Hadouken!");
                });
            });
        });
    });
});