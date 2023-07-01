function navbar() {
  const buttons = document.querySelectorAll(".hamburger-button");

  buttons.forEach((button) => {
      button.addEventListener("click", () => {
          const currentState = button.getAttribute("data-state");

          if (!currentState || currentState === "closed") {
              button.setAttribute("data-state", "opened");
              button.setAttribute("aria-expanded", "true");
          } else {
              button.setAttribute("data-state", "closed");
              button.setAttribute("aria-expanded", "false");
          }
      });
  });

  
    const navHeight = getComputedStyle(document.querySelector('#primary-nav')).height
    console.log(navHeight)
    document.documentElement.style.setProperty('--nav-height', navHeight)
}

navbar();
