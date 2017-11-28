var journalEditorApp = new Vue({

    // select DOM element for Vue
    el: '#editor',

    // data to be kept in client memory
    data: {
        input: '# hello'
    },

    // methods controlling the view
    methods: {
        update: _.debounce(function (e) {
            this.input = e.target.value
        }, 300)
    },

    // computed properties
    computed: {
        compiledMarkdown: function () {
            return marked(this.input, { sanitize: true })
        }
    }

})