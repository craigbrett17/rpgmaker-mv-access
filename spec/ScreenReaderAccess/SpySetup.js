function initializeSpies() {
    global.Window_Message = jasmine.createSpy('Window_Message');
    global.Window_Command = jasmine.createSpy('Window_Command');
    global.Window_SkillList = jasmine.createSpy('Window_SkillList');
    global.Window_Options = jasmine.createSpy('Window_Options');
    global.Window_BattleLog = jasmine.createSpy('Window_BattleLog');
    global.Window_ScrollText = jasmine.createSpy('Window_ScrollText');
    global.Window_BattleActor = jasmine.createSpy('Window_BattleActor');
    global.Window_BattleEnemy = jasmine.createSpy('Window_BattleEnemy');
    global.Window_ItemList = jasmine.createSpy('Window_ItemList');
}

module.exports = { initializeSpies };