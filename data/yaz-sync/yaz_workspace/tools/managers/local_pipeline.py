import os
import time
import multiprocessing

def worker_process(worker_id, task_queue):
    """
    Acts as an independent microservice worker consuming tasks from the shared queue.
    """
    print(f"[Worker {worker_id}] Activated on Process PID {os.getpid()}")
    while True:
        task = task_queue.get()
        if task is None:  # Shutdown signal
            print(f"[Worker {worker_id}] All tasks completed. Shutting down.")
            break
        
        # Replicates processing a segment of data in a pipeline
        print(f"[Worker {worker_id}] Processing: {task}")
        time.sleep(2)  # Simulate computing overhead

if __name__ == "__main__":
    # Determine available physical cores on your machine
    num_workers = multiprocessing.cpu_count()
    print(f"[Master] Mapped {num_workers} physical CPU cores for local pipeline.")

    # Shared task queue
    task_queue = multiprocessing.Queue()

    # Spawn worker processes
    processes = []
    for i in range(num_workers):
        p = multiprocessing.Process(target=worker_process, args=(i, task_queue))
        p.start()
        processes.append(p)

    # Feed tasks to the pipeline queue
    data_tasks = [f"Data Segment #{x}" for x in range(12)]
    print(f"[Master] Ingesting {len(data_tasks)} data segments into the pipeline...")
    for task in data_tasks:
        task_queue.put(task)

    # Append exit signals to the end of the queue for each worker
    for _ in range(num_workers):
        task_queue.put(None)

    # Wait for all processes to finish execution
    for p in processes:
        p.join()

    print("[Master] Local data pipeline execution finished successfully.")
