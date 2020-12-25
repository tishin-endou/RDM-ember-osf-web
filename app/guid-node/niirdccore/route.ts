import { action, computed } from '@ember/object';
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import ConfirmationMixin from 'ember-onbeforeunload/mixins/confirmation';

import GuidNode_niirdccore from 'ember-osf-web/guid-node/niirdccore/controller';
import Node from 'ember-osf-web/models/node';
import { GuidRouteModel } from 'ember-osf-web/resolve-guid/guid-route';
import Analytics from 'ember-osf-web/services/analytics';

export default class GuidNode_niirdccoreRoute extends Route.extend(ConfirmationMixin, {}) {
    @service analytics!: Analytics;

    model(this: GuidNode_niirdccoreRoute) {
        return this.modelFor('guid-node');
    }

    @action
    async didTransition() {
        const { taskInstance } = this.controller.model as GuidRouteModel<Node>;
        await taskInstance;
        const node = taskInstance.value;

        this.analytics.trackPage(node ? node.public : undefined, 'nodes');
    }

    // This tells ember-onbeforeunload's ConfirmationMixin whether or not to stop transitions
    @computed('controller.isPageDirty')
    get isPageDirty() {
        const controller = this.controller as GuidNode_niirdccore;
        return () => controller.isPageDirty;
    }
}
