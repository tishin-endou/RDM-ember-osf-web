import { action } from '@ember-decorators/object';
import Component from '@ember/component';

export default class Inline extends Component.extend() {
    // required arguments
    tags: string[] = ['Tag 1', 'Tag 2', 'Tag 3'];

    @action
    _addTag(this: Inline, tag: string) {
        this.set('tags', [...this.tags, tag].sort());
    }

    @action
    _removeTag(this: Inline, index: number) {
        this.set('tags', this.tags.slice().removeAt(index));
    }
}
