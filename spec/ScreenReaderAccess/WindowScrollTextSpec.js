const { JSDOM } = require('jsdom');
const { initializeSpies, destroySpies } = require('./SpySetup')

describe('Screen Reader Access plugin', () => {
    let document, dom;
    let windowScrollText;
    let startMessageCallSpy;

    const loadPlugin = () => require('../../src/ScreenReaderAccess');
    const getAnnounceOutput = () => document.getElementById('sr-announce').innerText;

    describe('Given a blank new window', () => {
        beforeAll(() => {
            dom = new JSDOM();
            document = global.document = dom.window.document;

            // spy on the objects we monkeypatch
            initializeSpies();
            startMessageCallSpy = jasmine.createSpy('Window_ScrollText.startMessage.call')
            windowScrollText = {
                startMessage: jasmine.createSpy('Window_ScrollText.startMessage', { call: startMessageCallSpy }),
                convertEscapeCharacters: jasmine.createSpy('Window_ScrollText.convertEscapeCharacters').and.callFake((text) => text)
            }
            global.Window_ScrollText = { prototype: windowScrollText };
        });

        afterAll(() => {
            dom.window.close();
            delete global.document;
            destroySpies();
            // delete the cached require for the plugin load
            delete require.cache[require.resolve('../../src/ScreenReaderAccess')];
        });

        describe('And the plugin is loaded', () => {
            beforeEach(() => {
                loadPlugin();
            });

            describe('And that a scroll text window is displayed', () => {
                let $gameMessageSpy;

                beforeEach(() => {
                    $gameMessageSpy = jasmine.createSpyObj('$gameMessage', ['allText']);
                    $gameMessageSpy.allText.and.returnValue("");
                    global.$gameMessage = $gameMessageSpy;
                });

                it('Then it should call through to the original engine code', () => {
                    Window_ScrollText.prototype.startMessage();

                    // Assert that the spy was called
                    expect(startMessageCallSpy).toHaveBeenCalled();
                });

                for (const testCase of [
                    {
                        testName: "a standard message",
                        gameMessage: "In A.D. 2101<br>War was beginning.",
                        expectedOutput: "In A.D. 2101 War was beginning."
                    },
                    {
                        testName: "a message containing some random unprintable characters",
                        gameMessage: "Captain: What happen?",
                        expectedOutput: "Captain: What happen?"
                    }
                ]) {
                    describe(`And it contains ${testCase.testName}`, () => {
                        it('Then the expected text is output', () => {
                            $gameMessageSpy.allText.and.returnValue(testCase.gameMessage);

                            Window_ScrollText.prototype.startMessage();

                            const output = getAnnounceOutput();
                            expect(output).toBe(testCase.expectedOutput);
                        });
                    });
                }

                describe('And it contains escape characters that the game will replace', () => {
                    it('Then the changes from convertEscapeCharacters appear in the output', () => {
                        const originalMessage = "\N[2]: Somebody set up us the \W[1].";
                        const expectedMessage = "Mechanic: Somebody set up us the bomb.";
                        $gameMessageSpy.allText.and.returnValue(originalMessage);
                        windowScrollText.convertEscapeCharacters.and.callFake((text) => {
                            return text.replace("\N[2]", "Mechanic")
                                .replace("\W[1]", "bomb");
                        });

                        Window_ScrollText.prototype.startMessage();

                        const output = getAnnounceOutput();
                        expect(output).toBe(expectedMessage);
                    });
                });
            });
        });
    });
});