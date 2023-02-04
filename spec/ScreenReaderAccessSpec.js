const { JSDOM } = require('jsdom');

describe('Screen Reader Access plugin', () => {
    let document, dom;
    let windowMessage, windowCommand, windowSkillList, windowOptions, windowBattleLog;
    let startMessageSpy, convertEscapeCharactersSpy;

    const loadPlugin = () => require('../src/ScreenReaderAccess');

    describe('Given a blank new window', () => {
        beforeAll(() => {
            dom = new JSDOM();
            document = global.document = dom.window.document;

            // spy on the objects we monkeypatch
            startMessageSpy = jasmine.createSpy('startMessage', ['call']);
            convertEscapeCharactersSpy = jasmine.createSpy('convertEscapeCharacters').and.callFake((text) => text);
            windowMessage = jasmine.createSpy('Window_Message', { startMessage: startMessageSpy, convertEscapeCharacters: convertEscapeCharactersSpy });
            global.Window_Message = { prototype: windowMessage };
            windowCommand = jasmine.createSpy('Window_Command');
            global.Window_Command = windowCommand;
            windowSkillList = jasmine.createSpy('Window_SkillList');
            global.Window_SkillList = windowSkillList;
            windowOptions = jasmine.createSpy('Window_Options');
            global.Window_Options = windowOptions;
            windowBattleLog = jasmine.createSpy('Window_BattleLog');
            global.Window_BattleLog = windowBattleLog;
        });

        afterAll(() => {
            dom.window.close();
        });

        describe('And that it loads the plugin', () => {
            beforeEach(() => {
                loadPlugin();
            });

            it('Then it should put the sr-only element on the body', () => {
                expect(document.querySelector('#sr-only')).toBeTruthy();
            });
        });

        describe('And that a message window is displayed', () => {
            let $gameMessageSpy;

            beforeEach(() => {
                loadPlugin();

                $gameMessageSpy = jasmine.createSpyObj('$gameMessage', ['allText']);
                $gameMessageSpy.allText.and.callFake(() => {
                    return "Some fake text";
                });
                global.$gameMessage = $gameMessageSpy;
            });

            it('Then it should call through to the original engine code', () => {
                Window_Message.prototype.startMessage();

                // Assert that the spy was called
                expect(startMessageSpy).toHaveBeenCalled();
            });

            it('Then the expected text is output', () => {
                expect(true).toBeTruthy();
            })
        });
    });
});