function updateMenus() {
    let menus = document.querySelectorAll('.menu')
    console.log(menus)
    menus.forEach(menu => {
        let trigger = menu.querySelector('.trigger')
        console.log(menu)
        console.log(trigger)
        trigger.addEventListener("click", () => {
            const currentState = trigger.getAttribute("data-state");
  
            if (!currentState || currentState === "closed") {
                trigger.setAttribute("data-state", "open");
                trigger.setAttribute("aria-expanded", "true");
            } else {
                trigger.setAttribute("data-state", "closed");
                trigger.setAttribute("aria-expanded", "false");
            }
        });
        document.addEventListener('click', e => {
            if (e.target != trigger) {
                trigger.setAttribute("data-state", "closed");
                trigger.setAttribute("aria-expanded", "false");
            }
        })
    });
}

updateMenus()

import dialogPolyfill from '../dialog-polyfill/dialog-polyfill.esm.js'

let dialogs = document.querySelectorAll('dialog')
dialogs.forEach(dialog => {
    dialogPolyfill.registerDialog(dialog)
});

function download(data, filename, type) {
    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
}

export { download }
