(function (global) {
  const AlarmManager = (function () {
    let _audioSrc = "alarm.mp3";
    let _visualClass = "alarm-active";
    const _alarms = {};
    const _audioMap = {};
    let _intervalId = null;
    const CHECK_MS = 1000;

    function init(opts = {}) {
      if (opts.audioSrc) _audioSrc = opts.audioSrc;
      if (opts.visualClass) _visualClass = opts.visualClass;
      if (_intervalId) clearInterval(_intervalId);
      _intervalId = setInterval(_tick, CHECK_MS);
    }

    function registerTask(task) {
      if (!task || !task.alarmAt) return;
      if (task.alarmTriggered) return;
      _alarms[task.id] = task;
    }

    function cancelTask(id) {
      delete _alarms[id];
      silence(id);
      const li = document.querySelector(`[data-id="${id}"]`);
      if (li) li.classList.remove(_visualClass);
    }

    function setAudioSrc(src) {
      if (!src) return;
      _audioSrc = src;
    }

    function setVisualClass(cls) {
      if (!cls) return;
      _visualClass = cls;
    }

    function _tick() {
      const now = Date.now();
      Object.keys(_alarms).forEach((id) => {
        const task = _alarms[id];
        const t = new Date(task.alarmAt).getTime();
        if (isNaN(t)) {
          delete _alarms[id];
          return;
        }
        if (now >= t) {
          try {
            const audio = new Audio(_audioSrc);
            audio.loop = true;
            const p = audio.play();
            if (p && typeof p.catch === "function") {
              p.catch(() => {});
            }
            _audioMap[id] = audio;
          } catch (e) {}

          const li = document.querySelector(`[data-id="${id}"]`);
          if (li) li.classList.add(_visualClass);

          if (navigator.vibrate) {
            try {
              navigator.vibrate([200, 100, 200]);
            } catch (e) {}
          }

          const evt = new CustomEvent("alarm:fired", { detail: { id } });
          window.dispatchEvent(evt);

          delete _alarms[id];
        }
      });
    }

    function silence(id) {
      const audio = _audioMap[id];
      if (audio) {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch (e) {}
        delete _audioMap[id];
      }
      const li = document.querySelector(`[data-id="${id}"]`);
      if (li) li.classList.remove(_visualClass);
    }

    function silenceAll() {
      Object.keys(_audioMap).forEach((id) => {
        silence(id);
      });
    }

    function playNow() {
      try {
        const audio = new Audio(_audioSrc);
        const p = audio.play();
        if (p && typeof p.catch === "function") {
          p.catch(() => {
            alert(
              "Navegador bloqueou reprodução automática. Clique na página e tente novamente."
            );
          });
        }
      } catch (e) {
        alert("Erro ao tocar o áudio de teste.");
      }
    }

    return {
      init,
      registerTask,
      cancelTask,
      setAudioSrc,
      setVisualClass,
      silence,
      silenceAll,
      playNow,
    };
  })();

  global.AlarmManager = AlarmManager;
})(window);
