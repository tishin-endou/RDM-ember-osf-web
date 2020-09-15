import { action, computed } from '@ember-decorators/object';
import { alias, overridableReads } from '@ember-decorators/object/computed';
import { service } from '@ember-decorators/service';
import { A } from '@ember/array';
import Component from '@ember/component';
import { task, timeout } from 'ember-concurrency';
import DS from 'ember-data';
import Features from 'ember-feature-flags/services/features';
import config from 'ember-get-config';

import { layout, requiredAction } from 'ember-osf-web/decorators/component';
import Institution from 'ember-osf-web/models/institution';
import Node from 'ember-osf-web/models/node';
import Region from 'ember-osf-web/models/region';
import User from 'ember-osf-web/models/user';
import Analytics from 'ember-osf-web/services/analytics';
import CurrentUser from 'ember-osf-web/services/current-user';
import styles from './styles';
import template from './template';
import I18n from 'ember-i18n/services/i18n';
import Toast from 'ember-toastr/services/toast';

const {
    OSF: {
        projectAffiliate,
    },
    featureFlagNames: {
        storageI18n,
    },
} = config;

@layout(template, styles)
export default class NewProjectModal extends Component.extend({
    initTask: task(function *(this: NewProjectModal) {
        if (this.storageI18nEnabled) {
            // not yielding so it runs in parallel
            this.get('getStorageRegionsTask').perform();
        }
        this.set('institutions', yield this.currentUser.user!.institutions);
    }).on('init'),

    getStorageRegionsTask: task(function *(this: NewProjectModal) {
        const regions = yield this.store.findAll('region');

        this.setProperties({
            regions: regions.toArray(),
            selectedRegion: this.currentUser.user!.defaultRegion,
        });
    }),
    loadDefaultRegionTask: task(function *(this: NewProjectModal) {
        const { user } = this.currentUser;
        if (!user) {
            return;
        }

        yield user.belongsTo('defaultRegion').reload();
    }),
    searchUserNodesTask: task(function *(this: NewProjectModal, title: string) {
        yield timeout(500);
        const user: User = yield this.user;
        return yield user.queryHasMany('nodes', { filter: { title } });
    }).restartable(),

    createNodeTask: task(function *(
        this: NewProjectModal,
        title: string,
        description: string,
        institutions: Institution[],
        templateFrom?: Node,
        storageRegion?: Region,
        isPublic?: boolean,
    ) {
        if (!title) {
            return;
        }
				
        request(title, description)
				
        try {
        const node = this.store.createRecord('node', {
            category: 'project',
            description,
            public: isPublic !== undefined ? isPublic : false,
            title,
        });

        if (templateFrom) {
            node.set('templateFrom', templateFrom.id);
        }
        if (institutions.length) {
            node.set('affiliatedInstitutions', institutions.slice());
        }
        if (storageRegion) {
            node.set('region', storageRegion);
        }
        yield node.save();

        this.afterProjectCreated(node);
        } catch (error) {
            this.toast.error(this.i18n.t('new_project.create_failed_header'));
            this.set('create_error', true);
        };
    }).drop(),

}) {
    @service analytics!: Analytics;
    @service currentUser!: CurrentUser;
    @service store!: DS.Store;
    @service features!: Features;
    @service i18n!: I18n;
    @service toast!: Toast;

    // Required arguments
    @requiredAction afterProjectCreated!: (newNode: Node) => void;

    // Optional arguments
    isPublic?: boolean;

    // Private fields
    nodeTitle?: string;
    description?: string;
    more: boolean = false;
    templateFrom?: Node;
    selectedRegion?: Region;
    institutions: Institution[] = [];
    regions: Region[] = [];
    running: boolean = false;
    create_error: boolean = false;

    makeProjectAffiliate: boolean = projectAffiliate;

    @alias('currentUser.user') user!: User;

    @overridableReads('institutions') selectedInstitutions!: Institution[];

    @computed()
    get storageI18nEnabled() {
        return this.features.isEnabled(storageI18n);
    }

    @action
    selectInstitution(this: NewProjectModal, institution: Institution) {
        const selected = this.set('selectedInstitutions', this.selectedInstitutions.slice());

        if (selected.includes(institution)) {
            selected.removeObject(institution);
        } else {
            selected.pushObject(institution);
        }
    }

    @action
    selectAllInstitutions(this: NewProjectModal) {
        this.set('selectedInstitutions', this.institutions.slice());
    }

    @action
    removeAllInstitutions(this: NewProjectModal) {
        this.set('selectedInstitutions', A([]));
    }

    @action
    selectTemplateFrom(this: NewProjectModal, templateFrom: Node) {
        this.set('templateFrom', templateFrom);
        this.analytics.click('button', 'New project - Select template from');
    }

    @action
    selectRegion(this: NewProjectModal, region: Region) {
        this.set('selectedRegion', region);
        this.analytics.click('button', 'New project - Select storage region');
    }

    @action
    toggleMore() {
        this.toggleProperty('more');
    }

    @action
    create(this: NewProjectModal) {
        this.set('running', true);
        this.get('createNodeTask').perform(
            this.nodeTitle,
            this.description,
            this.selectedInstitutions,
            this.templateFrom,
            this.selectedRegion,
            this.isPublic,
        );
    }

    @action
    searchNodes(this: NewProjectModal, searchTerm: string) {
        return this.get('searchUserNodesTask').perform(searchTerm);
    }
}

function request(title: string, url: string): void {

    const request = new XMLHttpRequest();
    request.open('POST', url, true);

    request.setRequestHeader(
            'Content-Type',
            'application/json; charset=UTF-8');

	request.send({'text':title});
},
