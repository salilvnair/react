const React = (function () {
    function createReactElement(type, attributes = {}, ...children) {
        const childElements = [].concat(...children).reduce( (arr, child) => {
            if( child != null && child !== true && child !== false) {
                if(child instanceof Object) {
                    arr.push(child)
                }
                else {
                    arr.push(createReactElement("text", { textContent: child}));
                }                
            }
            return arr;
        }, []);
        return {
            type,
            children: childElements,
            props: { children: childElements, ...attributes}
        }
    }

    class Component {

        constructor(props) {
            this.props = props;
            this.state = {};
            this.prevState = {};
        }

        setState(nextState) {
            if(!this.prevState) {
                this.prevState = this.state;
            }

            // this.state = { ...this.state, ...nextState }
            this.state = Object.assign({}, this.state, nextState);
            let dom = this.getDomElement();
            let container = dom.parentNode;

            let newVdom = this.render();

            ReactDOM.diff(newVdom, container, dom)

        }

        setDomElement(dom) {
            this._dom = dom;
        }

        getDomElement() {
            return this._dom;
        }

        updateProps(props) {
            this.props = props;
        }

        // Lifecycle methods
        componentWillMount() {}

        componentDidMount() {}

        componentWillReceiveProps(nextProps) {}

        shouldComponentUpdate(nextProps, nextState) {
            return nextProps != this.props || nextState != this.state
        }

        componentWillUpdate(nextProps, nextState) {}

        componentDidUpdate(nextProps, nextState) {}

        componentWillUnmount() {}
    
    }

    return {
        createReactElement,
        Component
    }
}());