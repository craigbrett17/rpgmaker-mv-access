const { JSDOM } = require('jsdom');
const { initializeSpies, destroySpies } = require('./SpySetup')

describe('Screen Reader Access plugin', () => {
    let document, dom;
    let windowScrollText;
    let startMessageCallSpy;

    const loadPlugin = () => require('../../src/ScreenReaderAccess');
    const getLoggingElement = () => document.getElementById('sr-log');

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
                // clear out the existing logs
                const log = getLoggingElement();
                while (log && log.firstChild) {
                    log.firstChild.remove();
                }

                loadPlugin();
            });

            describe('And that a scroll text window is displayed', () => {
                let $gameMessageSpy;

                beforeEach(() => {
                    $gameMessageSpy = jasmine.createSpyObj('$gameMessage', ['allText']);
                    global.$gameMessage = $gameMessageSpy;
                });

                describe("And a single message is announced", () => {
                    it("Then this message is also output in the log", () => {
                        const expectedMessage = "If you read this message then your life will be better";
                        $gameMessageSpy.allText.and.returnValue(expectedMessage);

                        Window_ScrollText.prototype.startMessage();

                        const logElement = getLoggingElement();
                        expect(logElement.childElementCount).toBe(1);
                        const logNode = logElement.childNodes.item(0);
                        expect(logNode.innerText).toBe(expectedMessage);
                    });
                })

                describe("And many messages are announced", () => {
                    const maxNumberOfMessages = 20;

                    it("Then the messages are truncated in a rolling log", () => {
                        
                        for (let index = 0; index <= maxNumberOfMessages + 1; index++) {
                            const expectedMessage = "This is page " + index;
                            $gameMessageSpy.allText.and.returnValue(expectedMessage);
    
                            Window_ScrollText.prototype.startMessage(); 
                        }

                        const logElement = getLoggingElement();
                        expect(logElement.childElementCount).toBe(maxNumberOfMessages);
                        
                        const first = logElement.childNodes.item(0);
                        expect(first.innerText).toBe("This is page " + (maxNumberOfMessages + 1));
                    });
                })

                describe("And duplicate messages are announced", () => {
                    it("Then repeating messages are not logged", () => {
                        $gameMessageSpy.allText.and.returnValue("This message will be repeated");
    
                        Window_ScrollText.prototype.startMessage(); 
                        Window_ScrollText.prototype.startMessage(); 

                        $gameMessageSpy.allText.and.returnValue("This will be a unique, separate message.");

                        Window_ScrollText.prototype.startMessage(); 

                        const logElement = getLoggingElement();
                        expect(logElement.childElementCount).toBe(2);
                        
                        const first = logElement.childNodes.item(0);
                        expect(first.innerText).toBe("This will be a unique, separate message.");
                        const second = logElement.childNodes.item(1);
                        expect(second.innerText).toBe("This message will be repeated");
                    });
                })
            });
        });
    });
});