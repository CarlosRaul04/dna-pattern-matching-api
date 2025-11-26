// src/workers/kmp.pool.js
const { Worker } = require('worker_threads');
const path = require('path');
const os = require('os');

const WORKER_COUNT = Math.max(2, Math.floor(os.cpus().length / 2));
console.log(`🔥 Pool de ${WORKER_COUNT} workers iniciado`);

class WorkerPool {
  constructor() {
    this.workers = [];
    this.freeWorkers = [];
    this.queue = [];

    for (let i = 0; i < WORKER_COUNT; i++) {
      this.spawnWorker();
    }
  }

  spawnWorker() {
    const worker = new Worker(path.join(__dirname, 'kmp.worker.js'));

    worker.on('message', (msg) => {
      const task = worker.currentTask;
      worker.currentTask = null;
      this.freeWorkers.push(worker);

      // ✅ Antes: callback(msg); (bien)
      //   Ahora: llamamos a task.resolve dentro del callback corregido
      task.resolve(msg);

      this.processQueue();
    });

    worker.on('error', (err) => console.error('❌ Worker error:', err));
    worker.on('exit', () => console.warn('⚠️ Worker terminated'));

    this.workers.push(worker);
    this.freeWorkers.push(worker);
  }

  runTask(patron, secuencia) {
    return new Promise((resolve) => {
      this.queue.push({ patron, secuencia, resolve });
      this.processQueue();
    });
  }

  processQueue() {
    if (this.queue.length === 0 || this.freeWorkers.length === 0) return;

    const worker = this.freeWorkers.pop();
    const task = this.queue.shift();

    // Guardamos la función resolve del task y la ejecutamos directamente.
    worker.currentTask = {
      resolve: (msg) => {
        if (msg.success) task.resolve(msg.idx);
        else task.resolve(-1);
      }
    };

    worker.postMessage({
      patron: task.patron,
      secuencia: task.secuencia
    });
  }
}

module.exports = new WorkerPool();
