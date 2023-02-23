const { JSDOM } = require('jsdom');
const { initializeSpies, destroySpies } = require('./SpySetup')

describe('Screen Reader Access plugin', () => {
    let document, dom;
    let windowSkillList;
    let selectCallSpy, itemSpy;

    const loadPlugin = () => require('../../src/ScreenReaderAccess');
    const getAnnounceOutput = () => document.getElementById('sr-announce').innerText;

    describe('Given a blank new window', () => {
        beforeAll(() => {
            dom = new JSDOM();
            document = global.document = dom.window.document;

            // spy on the objects we monkeypatch
            initializeSpies();
            selectCallSpy = jasmine.createSpy('Window_SkillList.select.call');
            itemSpy = jasmine.createSpy('Window_SkillList.item');
            windowSkillList = {
                select: jasmine.createSpy('Window_SkillList.select', { call: selectCallSpy }),
                item: itemSpy
            }
            global.Window_SkillList= { prototype: windowSkillList };
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

            describe('And a skill list selection is changed to a value with just a name', () => {
                beforeAll(() => {
                    itemSpy.and.returnValue({ name: "Attack" });
                    
                    Window_SkillList.prototype.select(0);
                });

                it('Then it should call through to the original engine code', () => {
                    // Assert that the spy was called
                    expect(selectCallSpy).toHaveBeenCalled();
                });

                it('Then it should announce the selected item', () => {
                    const output = getAnnounceOutput();
                    expect(output).toBe("Attack");
                });
            });

            describe('And a skill list selection is changed to a value with a name and description', () => {
                const name = "Jumping Flash";
                let description;
                const [ dataItems, dataWeapons, dataArmors, dataSkills, dataStates ] = [1, 2, 3, 4, 5].map(() => []);

                beforeAll(() => {
                    global.$dataItems = dataItems;
                    global.$dataWeapons = dataWeapons;
                    global.$dataArmors = dataArmors;
                    global.$dataSkills = dataSkills;
                    global.$dataStates = dataStates;
                });

                it('Then it should announce the selected item', () => {
                    description = "Leap in the air and blind the enemy with a bright flash."
                    itemSpy.and.returnValue({ name: name, description: description });
                    
                    Window_SkillList.prototype.select(0);

                    const output = getAnnounceOutput();
                    expect(output).toBe(`${name}: ${description}`);
                });

                describe('And the description contains a valid icon', () => {
                    beforeAll(() => {
                        dataStates.push({ iconIndex: 1, name: "blindness" });
                    });
    
                    it('Then it should announce the selected item with the icon replaced with the name', () => {
                        description = "Leap into the air and blind the enemy with a flash of light. Causes \\I[1] for 3 turns.";
                        itemSpy.and.returnValue({ name: name, description: description });
                        
                        Window_SkillList.prototype.select(0);

                        const output = getAnnounceOutput();
                        const expectedDescription = description.replace("\\I[1]", "blindness ");
                        expect(output).toBe(`${name}: ${expectedDescription}`);
                    });
                });
            });

            describe('And the skill listselection is changed to a null value', () => {
                beforeAll(() => {
                    document.querySelector('#sr-announce').innerText = undefined;
                    itemSpy.and.returnValue(null);

                    Window_SkillList.prototype.select(0);
                });

                it('Then no announcement should be made', () => {
                    const output = getAnnounceOutput();
                    expect(output).toBeUndefined();
                });
            });
        });
    });
});