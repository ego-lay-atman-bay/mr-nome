const registerServiceWorker = async (swPath) => {
    console.log('installing', swPath)
    if ("serviceWorker" in navigator) {
        try {
            const registration = await navigator.serviceWorker.register(swPath, {
                scope: "./",
            });
            if (registration.installing) {
                console.log("Service worker installing");
            } else if (registration.waiting) {
                console.log("Service worker installed");
            } else if (registration.active) {
                console.log("Service worker active");
            } else {
                console.error(`Registration failed`);
            }

            console.log('finished')
        } catch (error) {
            console.error(`Registration failed with ${error}`);
        }
    }
};
