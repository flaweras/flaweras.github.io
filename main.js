/* Бегущая строка (S0).
 *
 * Лента должна крутиться бесконечно и без разрывов. Анимация сдвигает трек
 * на -50% его ширины, поэтому конец цикла совпадает с началом только при двух
 * условиях: в треке ровно две одинаковые половины, и каждая половина не уже окна.
 * Сколько копий фразы нужно на ширину окна, в CSS не посчитать — считаем здесь
 * и повторяем фразу столько раз, сколько требуется. На узком телефоне это две
 * копии, на широком мониторе — десять, разрывов нет ни там, ни там.
 */
(function () {
  'use strict';

  var marquee = document.querySelector('.marquee');
  if (!marquee) return;

  var track = marquee.querySelector('.marquee__track');
  if (!track) return;

  var firstItem = track.querySelector('.marquee__item');
  if (!firstItem) return;

  var text = firstItem.textContent.trim();
  var SPEED = 21; // px/сек — как в исходной анимации 30s на две копии
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var lastWidth = -1;

  function createItem() {
    var item = document.createElement('span');
    item.className = 'marquee__item';
    item.textContent = text;
    return item;
  }

  function build() {
    /* При отключённых анимациях лента стоит на месте, и хватает одной фразы:
       вёрстку из HTML не трогаем. */
    if (reducedMotion.matches || !marquee.clientWidth) return;

    /* Один экземпляр для замера — getBoundingClientRect учитывает
       и padding-right, который даёт отступ между фразами. */
    track.textContent = '';
    var probe = createItem();
    track.appendChild(probe);
    var unit = probe.getBoundingClientRect().width;
    if (!unit) return;

    /* Копий на половину ровно столько, чтобы половина была не уже окна:
       тогда лента закрывает экран в любой момент прокрутки. */
    var perHalf = Math.ceil(marquee.clientWidth / unit);
    var total = perHalf * 2;

    track.textContent = '';
    for (var i = 0; i < total; i++) {
      var item = createItem();
      /* Озвучивать фразу много раз незачем: читалке достаточно первой копии. */
      if (i > 0) item.setAttribute('aria-hidden', 'true');
      track.appendChild(item);
    }

    /* Скорость одна и та же на всех экранах: она равна половине ширины трека,
       проходящей за это время, а не фиксированные 30 секунд. */
    track.style.setProperty('--marquee-duration', ((unit * perHalf) / SPEED).toFixed(2) + 's');
  }

  function rebuildIfWidthChanged() {
    if (marquee.clientWidth === lastWidth) return;
    lastWidth = marquee.clientWidth;
    build();
  }

  build();
  lastWidth = marquee.clientWidth;

  /* Фраза может «поехать» после загрузки веб-шрифта — пересчитываем ещё раз. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      lastWidth = marquee.clientWidth;
      build();
    });
  }

  var frame = 0;
  window.addEventListener('resize', function () {
    if (frame) return;
    frame = window.requestAnimationFrame(function () {
      frame = 0;
      rebuildIfWidthChanged();
    });
  });

  if (reducedMotion.addEventListener) {
    reducedMotion.addEventListener('change', function () {
      lastWidth = -1;
      rebuildIfWidthChanged();
    });
  }
}());
