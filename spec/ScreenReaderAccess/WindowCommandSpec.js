const { JSDOM } = require('jsdom');
const { initializeSpies, destroySpies } = require('./SpySetup')

describe('Screen Reader Access plugin', () => {
    let document, dom;
    let windowCommand;
    let selectCallSpy, currentDataSpy;

    const loadPlugin = () => require('../../src/ScreenReaderAccess');
    const getAnnounceOutput = () => document.getElementById('sr-announce').innerText;

    describe('Given a blank new window', () => {
        beforeAll(() => {
            dom = new JSDOM();
            document = global.document = dom.window.document;

            // spy on the objects we monkeypatch
            initializeSpies();
            selectCallSpy = jasmine.createSpy('Window_Command.select.call');
            currentDataSpy = jasmine.createSpy('Window_Command.currentData');
            windowCommand = {
                select: jasmine.createSpy('Window_Command.select', { call: selectCallSpy }),
                currentData: currentDataSpy
            }
            global.Window_Command= { prototype: windowCommand };
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

            describe('And that a command window selection is changed to a valid value', () => {
                beforeAll(() => {
                    currentDataSpy.and.returnValue({ name: "Load Game" });
                    
                    Window_Command.prototype.select(0);
                });

                it('Then it should call through to the original engine code', () => {
                    // Assert that the spy was called
                    expect(selectCallSpy).toHaveBeenCalled();
                });

                it('Then it should announce the selected item', () => {
                    const output = getAnnounceOutput();
                    expect(output).toBe("Load Game");
                });

            });
            
            describe('And that a command window selection is changed to a null value', () => {
                beforeAll(() => {
                    document.querySelector('#sr-announce').innerText = undefined;
                    currentDataSpy.and.returnValue(null);
                    
                    Window_Command.prototype.select(0);
                });

                it('Then no announcement should be made', () => {
                    const output = getAnnounceOutput();
                    expect(output).toBeUndefined();
                });
            });
        });
    });
});