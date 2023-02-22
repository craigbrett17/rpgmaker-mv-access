const { JSDOM } = require('jsdom');
const { initializeSpies, destroySpies } = require('./SpySetup')

describe('Screen Reader Access plugin', () => {
    let document, dom;
    let windowOptions;
    let selectCallSpy, currentDataSpy, commandNameSpy, statusTextSpy;

    const loadPlugin = () => require('../../src/ScreenReaderAccess');
    const getAnnounceOutput = () => document.getElementById('sr-announce').innerText;

    describe('Given a blank new window', () => {
        beforeAll(() => {
            dom = new JSDOM();
            document = global.document = dom.window.document;

            // spy on the objects we monkeypatch
            initializeSpies();
            selectCallSpy = jasmine.createSpy('Window_Options.select.call');
            currentDataSpy = jasmine.createSpy('Window_Options.currentData');
            commandNameSpy = jasmine.createSpy('Window_Options.commandName');
            statusTextSpy = jasmine.createSpy('Window_Options.statusText');
            windowOptions = {
                select: jasmine.createSpy('Window_Options.select', { call: selectCallSpy }),
                currentData: currentDataSpy,
                commandName: commandNameSpy,
                statusText: statusTextSpy
            }
            global.Window_Options= { prototype: windowOptions };
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

            describe('And that an options window selection is changed to a valid value', () => {
                beforeEach(() => {
                    currentDataSpy.and.returnValue({ name: "BGM Volume" });
                    commandNameSpy.and.returnValue("BGM Volume");
                    statusTextSpy.and.returnValue("20%");
                    
                    Window_Options.prototype.select(0);
                });

                it('Then it should call through to the original engine code', () => {
                    // Assert that the spy was called
                    expect(selectCallSpy).toHaveBeenCalled();
                });

                it('Then it should announce the selected item', () => {
                    const output = getAnnounceOutput();
                    expect(output).toBe("BGM Volume: 20%");
                });

            });
            
            describe('And that a command window selection is changed to a null value', () => {
                beforeEach(() => {
                    document.querySelector('#sr-announce').innerText = undefined;
                    currentDataSpy.and.returnValue(null);
                    
                    Window_Options.prototype.select(0);
                });

                it('Then no announcement should be made', () => {
                    const output = getAnnounceOutput();
                    expect(output).toBeUndefined();
                });
            });
        });
    });
});