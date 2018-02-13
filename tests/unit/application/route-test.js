import { moduleFor, test } from 'ember-qunit';

moduleFor('route:application', 'Unit | Route | application', {
    needs: [
        'service:session',
        'service:moment',
        'service:metrics',
    ],
});

test('it exists', function(assert) {
    const route = this.subject();
    assert.ok(route);
});
