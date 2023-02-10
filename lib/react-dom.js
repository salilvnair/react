const ReactDOM = (function () {
    const render =  function(vdom, container, oldDom = container.firstChild) {
        diff(vdom, container, oldDom);
    }

    const diff = function (vdom, container, oldDom) {
        let oldVdom = oldDom && oldDom._virtualElement;

        let oldStatefulComponent = oldVdom && oldVdom.component;

        if (!oldDom) {
            mountElement(vdom, container, oldDom);
        }
        else if ((vdom.type !== oldVdom.type) && (typeof vdom.type !== "function")) {
            let newDomElement = createDomElement(vdom);
            oldDom.parentNode.replaceChild(newDomElement, oldDom);
        }
        else if (isFunction(vdom)) {
            diffComponent(vdom, oldStatefulComponent, container, oldDom);
        }
        else if (oldVdom && oldVdom.type === vdom.type) {
            if (oldVdom.type === "text") {
                updateTextNode(oldDom, vdom, oldVdom);
            } 
            else {
                updateDomElement(oldDom, vdom, oldVdom);
            }

            // reference to updated vdom
            oldDom._virtualElement = vdom;

            let keyedElements = {};
            for (let i = 0; i < oldDom.childNodes.length; i += 1) {
                const domElement = oldDom.childNodes[i];
                const key = domElement._virtualElement.props.key;

                if (key) {
                    keyedElements[key] = {
                        domElement,
                        index: i
                    };
                }

            }

            // Recursively diff children..
            if (Object.keys(keyedElements).length === 0) {
                vdom.children.forEach((child, i) => {
                    diff(child, oldDom, oldDom.childNodes[i]);
                });
            } 
            else {
                // Reconciliation based on keys
                vdom.children.forEach((virtualElement, i) => {
                    const key = virtualElement.props.key;
                    if (key) {
                        const keyedDomElement = keyedElements[key];
                        if (keyedDomElement) {
                            // Position the new element correctly based on key/index
                            if (oldDom.childNodes[i] && !oldDom.childNodes[i].isSameNode(keyedDomElement.domElement)) {
                                oldDom.insertBefore(keyedDomElement.domElement,
                                    oldDom.childNodes[i]);
                            }
                            diff(virtualElement, oldDom, keyedDomElement.domElement);
                        }
                        else {
                            mountElement(virtualElement, oldDom);
                        }
                    }
                });
            }

            // Remove old dom nodes
            let oldNodes = oldDom.childNodes;
            if (Object.keys(keyedElements).length === 0) {
                if (oldNodes.length > vdom.children.length) {
                    for (let i = oldNodes.length - 1; i >= vdom.children.length; i -= 1) {
                        let nodeToBeRemoved = oldNodes[i];
                        unmountNode(nodeToBeRemoved, oldDom);
                    }
                }
            } 
            else {
                if (oldNodes.length > vdom.children.length) {
                    for (let i = 0; i < oldDom.childNodes.length; i += 1) {
                        let oldChild = oldDom.childNodes[i];
                        let oldKey = oldChild.getAttribute("key");

                        let found = false;
                        for (let n = 0; n < vdom.children.length; n += 1) {
                            if (vdom.children[n].props.key == oldKey) {
                                found = true;
                                break;
                            }
                        }

                        if (!found) {
                            unmountNode(oldChild, oldDom);
                        }

                    }
                }
            }
        }
    }

    const createDomElement = function(vdom) {
        let newDomElement = null;
        if (vdom.type === "text") {
            newDomElement = document.createTextNode(vdom.props.textContent);
        } 
        else {
            newDomElement = document.createElement(vdom.type);
            updateDomElement(newDomElement, vdom);
        }

        newDomElement._virtualElement = vdom;
        vdom.children.forEach((child) => {
            newDomElement.appendChild(createDomElement(child));
        });

        // Set refs
        if (vdom.props && vdom.props.ref) {
            vdom.props.ref(newDomElement);
        }

        return newDomElement;
    }

    const isFunction = function(obj) {
        return obj && 'function' === typeof obj.type;
    }

    const diffComponent = function(newVirtualElement, oldComponent, container, domElement) {
        if(isSameComponentType(oldComponent, newVirtualElement)) {
            updateComponent(newVirtualElement, oldComponent, container, domElement);
        }
        else {
            mountElement(newVirtualElement, container, domElement);
        }
    }

    const isSameComponentType = function(oldComponent, newVirtualElement) {
        return oldComponent && newVirtualElement.type === oldComponent.constructor;
    }

    const updateComponent = function(newVirtualElement, oldComponent, container, domElement) {

        // Lifecycle method
        oldComponent.componentWillReceiveProps(newVirtualElement.props);

        // Lifecycle method
        if (oldComponent.shouldComponentUpdate(newVirtualElement.props)) {
            const prevProps = oldComponent.props;

            // Invoke LifeCycle
            oldComponent.componentWillUpdate(newVirtualElement.props, oldComponent.state);

            // Update component
            oldComponent.updateProps(newVirtualElement.props);

            // Call Render
            // Generate new vdom
            const nextElement = oldComponent.render();
            nextElement.component = oldComponent;

            // Recursively diff again
            ReactDOM.diff(nextElement, container, domElement, oldComponent);

            // Invoke LifeCycle
            oldComponent.componentDidUpdate(prevProps);

        }

    }

    const unmountNode = function(domElement, parentComponent) {
        const virtualElement = domElement._virtualElement;
        if (!virtualElement) {
            domElement.remove();
            return;
        }

        // If component exist
        let oldComponent = domElement._virtualElement.component;
        if (oldComponent) {
            oldComponent.componentWillUnmount();
        }

        // Recursive calls agains
        while (domElement.childNodes.length > 0) {
            unmountNode(domElement.firstChild);
        }

        if (virtualElement.props && virtualElement.props.ref) {
            virtualElement.props.ref(null);
        }

        // Clear out event handlers
        Object.keys(virtualElement.props).forEach(propName => {
            if (propName.slice(0, 2) === "on") {
                const event = propName.toLowerCase().slice(2);
                const handler = virtualElement.props[propName];
                domElement.removeEventListener(event, handler);
            }
        });

        domElement.remove();
    }

    const updateTextNode = function(domElement, newVirtualElement, oldVirtualElement) {
        if (newVirtualElement.props.textContent !== oldVirtualElement.props.textContent) {
            domElement.textContent = newVirtualElement.props.textContent;
        }
        // Set a reference to the newvddom in oldDom
        domElement._virtualElement = newVirtualElement;
    }

    const mountElement =  function( vdom, container, oldDom) {
        
        if (isFunction(vdom)) {
            //functional or class based React component
            return mountComponent(vdom, container, oldDom);
        } 
        else {
            //Native DOM elements and functions.
            return mountSimpleNode(vdom, container, oldDom);
        }
    }

    const mountComponent = function(vdom, container, oldDomElement) {
        let nextvDom = null, component = null, newDomElement = null;

        if (isFunctionalComponent(vdom)) {
            nextvDom = buildFunctionalComponent(vdom);
        }
        else {
            nextvDom = buildStatefulComponent(vdom);
            component = nextvDom.component;
        }

        // Recursively render child components
        if (isFunction(nextvDom)) {
            return mountComponent(nextvDom, container, oldDomElement);
        } 
        else {
            newDomElement = mountElement(nextvDom, container, oldDomElement);
        }

        // Adding support for ref key
        if (component) {
            component.componentDidMount();  // Life cycle method
            if (component.props.ref) {
                component.props.ref(component);
            }
        }

        return newDomElement;

    }

    const isFunctionalComponent = function(vnode) {
        let nodeType = vnode && vnode.type;
        return nodeType && isFunction(vnode)
            && !(nodeType.prototype && nodeType.prototype.render);
    }

    const buildFunctionalComponent = function(vnode, context) {
        return vnode.type(vnode.props || {});
    }

    const buildStatefulComponent = function(virtualElement) {
        const component = new virtualElement.type(virtualElement.props);
        const nextElement = component.render();
        nextElement.component = component;
        return nextElement;
    }

    const mountSimpleNode = function(vdom, container, oldDomElement, parentComponent) {
        let newDomElement = null;
        const nextSibling = oldDomElement && oldDomElement.nextSibling;

        if (vdom.type === "text") {
            newDomElement = document.createTextNode(vdom.props.textContent);
        }
        else {
            newDomElement = document.createElement(vdom.type);
            updateDomElement(newDomElement, vdom);
        }

        newDomElement._virtualElement = vdom;

        // Remove old nodes
        if(oldDomElement) {
            unmountNode(oldDomElement, parentComponent);
        }

        if (nextSibling) {
            container.insertBefore(newDomElement, nextSibling);
        }
        else {
            container.appendChild(newDomElement);
        }

        let component = vdom.component;
        if(component) {
            component.setDomElement(newDomElement);
        }

        //render children
        vdom.children.forEach(child => {
            mountElement(child, newDomElement);
        });

        if (vdom.props && vdom.props.ref) {
            vdom.props.ref(newDomElement);
        }
    }

     //TODO: Set DOM attributes and events
    const updateDomElement = function(domElement, newVirtualElement, oldVirtualElement = {}) {
        
        const newProps = newVirtualElement.props || {};
        const oldProps = oldVirtualElement.props || {};

        Object.keys(newProps).forEach(propName => {
            const newProp = newProps[propName];
            const oldProp = oldProps[propName];
            if (newProp !== oldProp) {
                if (propName.slice(0, 2) === "on") {
                    // prop is an event handler
                    const eventName = propName.toLowerCase().slice(2);
                    domElement.addEventListener(eventName, newProp, false);
                    if (oldProp) {
                        domElement.removeEventListener(eventName, oldProp, false);
                    }
                } 
                else if (propName === "value" || propName === "checked") {
                    // this are special attributes that cannot be set
                    // using setAttribute
                    domElement[propName] = newProp;
                } 
                else if (propName !== "children") {
                    // React the 'children' prop
                    if (propName === "className") {
                        domElement.setAttribute("class", newProps[propName]);
                    }
                    else if (propName === "style" && !newProps[propName].substring) {
                        let styleText = styleObjToCss(newProps[propName]);
                        domElement.style = styleText;
                    } 
                    else {
                        domElement.setAttribute(propName, newProps[propName]);
                    }
                }
            }
        });

        // remove oldProps
        Object.keys(oldProps).forEach(propName => {
            const newProp = newProps[propName];
            const oldProp = oldProps[propName];
            if (!newProp) {
                if (propName.slice(0, 2) === "on") {
                    // prop is an event handler
                    domElement.removeEventListener(propName, oldProp, false);
                } 
                else if (propName !== "children") {
                    // React the 'children' prop
                    domElement.removeAttribute(propName);
                }
            }
        });
    }

    const styleObjToCss = function(styleObj) {
        // I am not checking for non-dimensional props here
        // Assuming the correct dimensional values are passed for e.g. 10px etc

        let styleCss = "", sep = ":", term = ";";

        for (let prop in styleObj) {
            if (styleObj.hasOwnProperty(prop)) {
                let val = styleObj[prop];
                styleCss += `${jsToCss(prop)} : ${val} ${term}`;
            }
        }

        return styleCss;

    }

    const jsToCss = function(s) {
        // OLd react code base.
        let transformedText = s.replace(/([A-Z])/, '-$1').toLowerCase();
        // borderBottom transform to border-bottom
        return transformedText;
    }

    return {
        render,
        diff
    }
}());