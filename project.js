document.addEventListener("DOMContentLoaded", function() {
    const navLinks = document.querySelectorAll(".nav-link");
    const navbar = document.querySelector(".navbar");
    const sections = document.querySelectorAll("section");

    function changeNavbarBackground() {
        let scrollY = window.pageYOffset;
        
        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - navbar.offsetHeight;
            const sectionId = section.getAttribute("id");
            const navLink = document.querySelector(`.nav-link[href*=${sectionId}]`);

            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                if (navLink) navLink.classList.add("active");
                if (sectionId !== 'home') {
                    navbar.classList.add("scrolled");
                } else {
                    navbar.classList.remove("scrolled");
                }
            } else {
                if (navLink) navLink.classList.remove("active");
            }
        });
    }

    window.addEventListener("scroll", changeNavbarBackground);
    changeNavbarBackground(); // Call the function on page load as well
});

let slideIndex = 1;
showSlides(slideIndex);

function plusSlides(n) {
    showSlides(slideIndex += n);
}

function currentSlide(n) {
    showSlides(slideIndex = n);
}

function showSlides(n) {
    let i;
    let slides = document.getElementsByClassName("slide");
    let dots = document.getElementsByClassName("dot");
    if (n > slides.length) { slideIndex = 1 }
    if (n < 1) { slideIndex = slides.length }
    for (i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }
    for (i = 0; i < dots.length; i++) {
        dots[i].className = dots[i].className.replace(" active", "");
    }
    slides[slideIndex - 1].style.display = "block";
    dots[slideIndex - 1].className += " active";
}

document.addEventListener("DOMContentLoaded", function() {
    var typed = new Typed(".text", {
        strings: ["Frontend Web Development", "Full Stack Web Development", "UI/UX Design", "Blockchain Development", "Cyber Security", "Graphic Designing"],
        typeSpeed: 100,
        backSpeed: 100,
        backDelay: 1000,
        loop: true
    });
});

document.addEventListener("DOMContentLoaded", function() {
    var typed = new Typed(".text2", {
        strings: ["Frontend Web Development", "Full Stack Web Development", "UI/UX Design", "Blockchain Development", "Cyber Security", "Graphic Designing"],
        typeSpeed: 100,
        backSpeed: 100,
        backDelay: 1000,
        loop: true
    });
});

document.addEventListener("DOMContentLoaded", function() {
    var typed = new Typed(".text3", {
        strings: ["Clone of Amazon","Clone of youtube" ,"Portfolio" , "Clone of Netflix"],
        typeSpeed: 100,
        backSpeed: 100,
        backDelay: 1000,
        loop: true
    });
});
document.addEventListener("DOMContentLoaded", function() {
    var typed = new Typed(".text4", {
        strings: ["TECHON 0.1", "TECHHON 0.2" , " OOP IN C++" , "Master C Labnguage" ],
        typeSpeed: 100,
        backSpeed: 100,
        backDelay: 1000,
        loop: true
    });
});
document.addEventListener("DOMContentLoaded", function() {
    var typed = new Typed(".text5", {
        strings: ["Ali Ahmed","Abdullah Khalid" ,"Ahsan Ali" ],
        typeSpeed: 100,
        backSpeed: 100,
        backDelay: 1000,
        loop: true
    });
});
document.addEventListener("DOMContentLoaded", function() {
    var typed = new Typed(".text6", {
        strings: ["Participation","OOP In C++" ,"Master C Language", "Moble Graphics"],
        typeSpeed: 100,
        backSpeed: 100,
        backDelay: 1000,
        loop: true
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelector('.cards');
    const totalCards = document.querySelectorAll('.card').length;
    const maxVisibleCards = 3;
    let currentIndex = 0;

    document.querySelector('.toleft').addEventListener('click', function() {
        if (currentIndex > 0) {
            currentIndex--;
            updateCardPosition();
        }
    });

    document.querySelector('.toright').addEventListener('click', function() {
        if (currentIndex < totalCards - maxVisibleCards) {
            currentIndex++;
            updateCardPosition();
        }
    });

    function updateCardPosition() {
        cards.style.transform = `translateX(-${(100 / maxVisibleCards) * currentIndex}%)`;
    }
});


document.addEventListener('DOMContentLoaded', function () {
  const cards = document.querySelector('.cards');
  const leftArrow = document.querySelector('.arrow.left');
  const rightArrow = document.querySelector('.arrow.right');
  const dots = document.querySelectorAll('.dot');

  let currentIndex = 0;
  const cardGroups = [0, 4]; // Define indices for card_W and card_M groups

  function updateSlider() {
    const translateX = -currentIndex * 100 + 'vw';
    cards.style.transform = `translateX(${translateX})`;

    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentIndex);
    });
  }

  leftArrow.addEventListener('click', function () {
    if (currentIndex > 0) {
      currentIndex--;
      updateSlider();
    }
  });

  rightArrow.addEventListener('click', function () {
    if (currentIndex < cardGroups.length - 1) {
      currentIndex++;
      updateSlider();
    }
  });

  dots.forEach((dot, index) => {
    dot.addEventListener('click', function () {
      currentIndex = index;
      updateSlider();
    });
  });

  updateSlider();
});


