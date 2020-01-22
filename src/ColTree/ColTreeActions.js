import EventEmitter from 'events';

class ColTreeActions extends EventEmitter {

    refreshTree = ()  => {
        this.emit('refreshTree')
    }

    getListenerCount = (action) => {
        return this.listeners(action).length
    }
}
const colTreeActions = new ColTreeActions;

export default colTreeActions