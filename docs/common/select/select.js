function triggerOnchange (element) {
    if ("createEvent" in document) {
        var evt = document.createEvent("HTMLEvents");
        evt.initEvent("change", false, true);
        element.dispatchEvent(evt);
    }
    else
        element.fireEvent("onchange");
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
}

let menus = document.querySelectorAll('.select');
for (const key in menus) {
    if (Object.hasOwnProperty.call(menus, key)) {
        const element = menus[key]
        initMenu(element)
        continue
    }
}
