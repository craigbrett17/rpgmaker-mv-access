const { JSDOM } = require('jsdom');
const { initializeSpies } = require('./SpySetup')

describe('Screen Reader Access plugin', () => {
    let document, dom;
    let windowMessage;
    let startMessageCallSpy;

    const loadPlugin = () => require('../../src/ScreenReaderAccess');

    describe('Given a blank new window', () => {
        beforeAll(() => {
            dom = new JSDOM();
            document = global.document = dom.window.document;

            // spy on the objects we monkeypatch
            initializeSpies();
            startMessageCallSpy = jasmine.createSpy('Window_Message.startMessage.call')
            windowMessage = {
                startMessage: jasmine.createSpy('Window_Message.startMessage', { call: startMessageCallSpy }),
                convertEscapeCharacters: jasmine.createSpy('Window_Message.convertEscapeCharacters').and.callFake((text) => text)
            }
            global.Window_Message = { prototype: windowMessage };
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

                $gameMessageSpy = jasmine.createSpyObj('$gameMessage', ['allText', 'faceName']);
                $gameMessageSpy.allText.and.returnValue("");
                global.$gameMessage = $gameMessageSpy;
                global.$dataActors = [];
            });

            it('Then it should call through to the original engine code', () => {
                Window_Message.prototype.startMessage();

                // Assert that the spy was called
                expect(startMessageCallSpy).toHaveBeenCalled();
            });

            for (const testCase of [
                {
                    testName: "a standard message",
                    gameMessage: "She took a deep breath and prepared for battle.",
                    expectedOutput: "She took a deep breath and prepared for battle."
                },
                {
                    testName: "a message containing some random unprintable characters",
                    gameMessage: "Stealth camouflage! Can't you even die right?",
                    expectedOutput: "Stealth camouflage! Can't you even die right?"
                }
            ]) {
                describe(`And it contains ${testCase.testName}`, () => {
                    it('Then the expected text is output', () => {
                        $gameMessageSpy.allText.and.returnValue(testCase.gameMessage);

                        Window_Message.prototype.startMessage();

                        const output = document.getElementById('sr-only').innerText;
                        expect(output).toBe(testCase.expectedOutput);
                    });
                });
            }

            describe('And it contains escape characters that the game will replace', () => {
                it('Then the changes from convertEscapeCharacters appear in the output', () => {
                    const originalMessage = "\N[1] reached out, grasping the \W[1] firmly.";
                    const expectedMessage = "Samir reached out, grasping the Masamune firmly.";
                    $gameMessageSpy.allText.and.returnValue(originalMessage);
                    windowMessage.convertEscapeCharacters.and.callFake((text) => {
                        return text.replace("\N[1]", "Samir")
                            .replace("\W[1]", "Masamune");
                    });

                    Window_Message.prototype.startMessage();

                    const output = document.getElementById('sr-only').innerText;
                    expect(output).toBe(expectedMessage);
                });
            });

            describe('And the message box has a character face set', () => {
                beforeEach(() => {
                    $gameMessageSpy.faceName.and.returnValue('butterface');
                    $gameMessageSpy.allText.and.returnValue("Mooooo!");
                });

                describe('And the face matches an actor faceName', () => {
                    beforeEach(() => {
                        global.$dataActors.push({
                            name: 'Butterface the Cow',
                            faceName: 'butterface'
                        });
                    });

                    it('Then the name is set to the name of the actor', () => {
                        const expectedOutput = "Butterface the Cow: Mooooo!";

                        Window_Message.prototype.startMessage();

                        const output = document.getElementById('sr-only').innerText;
                        expect(output).toBe(expectedOutput);
                    });
                });

                describe('And the face does not  match an actor faceName', () => {
                    it('Then the name is set to the faceName', () => {
                        const expectedOutput = "butterface: Mooooo!";

                        Window_Message.prototype.startMessage();

                        const output = document.getElementById('sr-only').innerText;
                        expect(output).toBe(expectedOutput);
                    });
                });
            });

            describe('And it uses Yanfly MessageCore message window', () => {
                let yanflySpy;

                beforeEach(() => {
                    yanflySpy = jasmine.createSpy('Yanfly', { nameWindow: { _text: undefined } });
                    global.Yanfly = yanflySpy;
                    windowMessage.hasDifferentNameBoxText = jasmine.createSpy('hasDifferentNameBoxText')
                        .and.returnValue(true);
                });

                afterEach(() => {
                    delete global.Yanfly;
                    delete windowMessage.hasDifferentNameBoxText;
                });

                for (const testCase of [
                    {
                        testName: "a standard message with no name",
                        gameMessage: "Endure and survive",
                        expectedOutput: "Endure and survive"
                    },
                    {
                        testName: "a message from a speaker",
                        name: "<Mario>",
                        gameMessage: "It's a me!",
                        expectedOutput: "Mario: It's a me!"
                    },
                    {
                        testName: "a message from a speaker in colour",
                        name: "\\c[2]Lara Croft\\c",
                        gameMessage: "Hmmm. Where did I put that buttler?",
                        expectedOutput: "Lara Croft: Hmmm. Where did I put that buttler?"
                    },
                    {
                        testName: "a message that is in larger font",
                        name: "\\c[5]<Campbell>\\c",
                        gameMessage: "{{{SNAAAAAKE!}}}",
                        expectedOutput: "Campbell: SNAAAAAKE!"
                    },
                    {
                        testName: "a message that is in smaller font",
                        name: "Youngster",
                        gameMessage: "}I like shorts. They're comfortable and easy to wear.{",
                        expectedOutput: "Youngster: I like shorts. They're comfortable and easy to wear."
                    },
                    {
                        testName: "a message with multiple RESETCOLOR calls",
                        name: "\\c[15]<Lulu>RESETCOLOR",
                        gameMessage: "No matter how \c[12]darkRESETCOLOR the night, the \c[2]morningRESETCOLOR always comes.",
                        expectedOutput: "Lulu: No matter how dark the night, the morning always comes."
                    },
                    {
                        // we shouldn't *have* to parse these, but I've seen them and it trips up screen readers
                        testName: "a message with a random unprintable character instead of a backslash",
                        name: "\\c[15]c[12]<Count Dracular>RESETCOLOR",
                        gameMessage: "What is a man? But a miserable pile of secrets.",
                        expectedOutput: "Count Dracular: What is a man? But a miserable pile of secrets."
                    }
                ]) {
                    describe(`And it contains ${testCase.testName}`, () => {
                        it('Then the expected text is output', () => {
                            $gameMessageSpy.allText.and.callFake(() => testCase.gameMessage);
                            if (testCase.name) {
                                yanflySpy.nameWindow._text = testCase.name;
                            } else {
                                windowMessage.hasDifferentNameBoxText.and.returnValue(false);
                            }

                            Window_Message.prototype.startMessage();

                            const output = document.getElementById('sr-only').innerText;
                            expect(output).toBe(testCase.expectedOutput);
                        });
                    });
                }
            });
        });
    });
});