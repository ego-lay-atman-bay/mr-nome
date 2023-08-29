function triggerOnchange (element) {
    if ("createEvent" in document) {
        var evt = document.createEvent("HTMLEvents");
        evt.initEvent("change", false, true);
        element.dispatchEvent(evt);
    }
    else
        element.fireEvent("onchange");
}

function findOverflowParents(element, initEl) {

    function notVisible(el) {
        let overflow = getComputedStyle(el).overflow;
        return overflow !== 'visible';
    }

    let thisEl = element;
    
    if (thisEl == document.querySelector('html')) {
        return thisEl;
    }

    // if (!initEl) console.log('** Overflow check commence!', thisEl);
    let origEl = initEl || thisEl;
    // if (notVisible(thisEl)) console.warn("Overflow found on:", thisEl.tagName, { issue: "OVERFLOW IS NOT VISIBLE", tagName: thisEl.tagName, id: thisEl.id, class: thisEl.className, element: thisEl });
    if (thisEl != origEl && notVisible(thisEl)) {
        return thisEl;
    } else {
        return findOverflowParents(thisEl.parentElement, origEl);
    }
}

function initMenu(element, options) {
    element.trigger = element.querySelector('.trigger')
    element._options = element.querySelector('.options')

    element.getval = function() {
        return this.trigger.value || this.trigger.getAttribute('value')
    }

    element.setval = function(value) {
        this.trigger.setAttribute('value', value)

        let prev = this._options.querySelector('.selected')
        if (prev) {
            prev.classList.remove('selected')
        }

        let newval = this._options.querySelector(`.option[value="${value}"]`)
        if (newval) {
            newval.classList.add('selected')
            this.trigger.innerHTML = newval.innerHTML
        }
        this.trigger.setAttribute('aria-expanded', 'false')
    }

    element.getMenu = function () {
        let options = []

        let children = this._options.querySelectorAll('.option')

        children.forEach(child => {
            let classes = Array.from(child.classList)
                    options.push({
                        "value" : child.getAttribute('value'),
                        "text" : child.innerHTML,
                        "classes" : classes
                    })
        });

        return options
    }

    element.setMenu = function (menu) {

        this.clearMenu()

        menu.forEach(option => {
            this.addOption(option)
        });
    }

    element.clearMenu = function () {
        let options = this._options.querySelectorAll('.option')

        options.forEach(child => {
            child.remove()
        });
    }

    element.addOption = function (option) {

        let newOption = document.createElement('button')

        newOption.setAttribute('value', option['value'])
        newOption.setAttribute('ontouchstart', '')
        newOption.innerHTML = option['text']

        newOption.classList.add('option')

        option['classes'].forEach(Class => {
            newOption.classList.add(Class)
        });

        newOption.addEventListener('click', () => {
            element.setval(newOption.getAttribute('value'))
            triggerOnchange(element.trigger)
        })

        this._options.append(newOption)
    }

    element.fixHeight = function () {
        let parent = findOverflowParents(this._options)

        console.log('overflow', getComputedStyle(parent).overflow)
        let overflow = getComputedStyle(parent).overflow

        parent.style.overflow = 'hidden'

        let parentSize = parent.getBoundingClientRect()
        let size = this._options.getBoundingClientRect()

        console.log('parent', parent)

        console.log('parentSize', parentSize)
        console.log('size', size)

        let maxHeight = (parentSize.top - size.top) + parentSize.height

        let border = getComputedStyle(parent).borderBottomWidth

        this._options.style.setProperty('--max-height', `calc(${(maxHeight) + 'px'} - ${border})`)
        
        parent.style.overflow = overflow
    }

    let optionElements = element._options.querySelectorAll('.option')

    for (const option of optionElements) {
        option.addEventListener('click', () => {
            element.setval(option.getAttribute('value'))
            triggerOnchange(element.trigger)
        })
    }

    element.trigger.addEventListener('click', function (e) {
        let expanded = this.getAttribute('aria-expanded') == 'true'
        
        console.log('expanded?', expanded)

        this.setAttribute('aria-expanded', String(!expanded))

        element.fixHeight()
    })

    element.fixHeight()

}

const menus = document.querySelectorAll('.select');

for (const menu of menus) {
    initMenu(menu)
}

document.addEventListener('click', (e) => {
    let target = e.target

    const menuTriggers = document.querySelectorAll('.select .trigger')

    for (const trigger of menuTriggers) {
        if (trigger == target) {
            continue
        }
        trigger.setAttribute('aria-expanded', 'false')
    }
})
