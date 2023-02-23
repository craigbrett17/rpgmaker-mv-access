const spiedOn = [
    'Window_Message',
    'Window_Command',
    'Window_SkillList',
    'Window_Options',
    'Window_BattleLog',
    'Window_ScrollText',
    'Window_BattleActor',
    'Window_BattleEnemy',
    'Window_ItemList',
    'Window_ShopBuy',
    'Window_ShopNumber'
]

function initializeSpies() {
    for (const spyName of spiedOn) {
        global[spyName] = jasmine.createSpy(spyName);
    }
}

function destroySpies() {
    for (const spyName of spiedOn) {
        delete global[spyName];
    }
}

module.exports = {
    initializeSpies,
    destroySpies
};