const { it, describe, expect } = require('jasmine-core')

describe('Screen Reader Access plugin', () => {
    describe('Given that it loads the plugin', () => {        
        require('./RPGMakerFakes')
        require('../src/ScreenReaderAccess')
        
        it('Then it should put the sr-only element on the body', () => {
            expect(document.querySelector('#sr-only')).not.toBeNull();
        });
    });
});

