document.addEventListener('DOMContentLoaded', function() {
    // Typing effect for hero section
    const heroText = document.querySelector('#hero .hero-container h1');
    const subtitleElement = document.createElement('p');
    subtitleElement.classList.add('typed-subtitle');
    heroText.parentNode.insertBefore(subtitleElement, heroText.nextSibling);

    const subtitles = [
        'Data Scientist',
        'Backend Engineer', 
        'Full Stack Developer',
        'Machine Learning Enthusiast'
    ];

    function typeWriter(element, text, speed = 100) {
        element.textContent = '';
        let i = 0;
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            } else {
                setTimeout(() => eraseText(element), 2000);
            }
        }
        type();
    }

    function eraseText(element, speed = 50) {
        let text = element.textContent;
        let i = text.length;
        function erase() {
            if (i > 0) {
                element.textContent = text.substring(0, i - 1);
                i--;
                setTimeout(erase, speed);
            } else {
                const nextSubtitle = subtitles[(subtitles.indexOf(text) + 1) % subtitles.length];
                typeWriter(element, nextSubtitle);
            }
        }
        erase();
    }

    typeWriter(subtitleElement, subtitles[0]);

    // Skill bar animation
    const skillBars = document.querySelectorAll('.skills .progress .progress-bar');
    const skillSection = document.querySelector('#skills');

    function animateSkillBars() {
        skillBars.forEach(bar => {
            const percentage = bar.getAttribute('aria-valuenow');
            bar.style.width = '0%';
            setTimeout(() => {
                bar.style.width = `${percentage}%`;
            }, 100);
        });
    }

    // Scroll-triggered animations
    window.addEventListener('scroll', function() {
        const scrollPosition = window.scrollY;
        const skillsSectionTop = skillSection.offsetTop - window.innerHeight;

        if (scrollPosition > skillsSectionTop) {
            animateSkillBars();
        }
    });

    // Resume section hover effects
    const resumeItems = document.querySelectorAll('.resume .resume-item');
    resumeItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.02)';
            this.style.transition = 'transform 0.3s ease';
            this.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        });

        item.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            this.style.boxShadow = 'none';
        });
    });

    // Smooth scroll to sections
    document.querySelectorAll('a.nav-link').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});
