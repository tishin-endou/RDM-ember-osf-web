import { attr } from '@ember-decorators/data';
import OsfModel from './osf-model';

export default class IntegromatConfigModel extends OsfModel {
    @attr('string') webhook_url!: string;
    @attr('string') microsoft_teams_meetings!: string;
    @attr('string') workflows!: string;
    @attr('string') node_settings_id!: string;
    @attr('string') app_name_teams!: string;
    @attr('string') infoMsg!: string;
    @attr('string') info_grdm_scenario_processing!: string;
}

declare module 'ember-data/types/registries/model' {
    export default interface ModelRegistry {
        'integromat-config': IntegromatConfigModel;
    } // eslint-disable-line semi
}