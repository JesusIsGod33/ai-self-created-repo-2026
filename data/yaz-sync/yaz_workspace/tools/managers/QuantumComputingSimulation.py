import numpy as np

class QuantumComputingSimulation:
    def __init__(self):
        self.qubits = 0

    def create_qubits(self, num_qubits):
        self.qubits = num_qubits
        print(f"Created {num_qubits} qubits")

    def apply_quantum_gate(self, gate):
        print(f"Applied {gate} gate to qubits")

    def measure_qubits(self):
        print("Measured qubits")

# Create an instance of the QuantumComputingSimulation
simulation = QuantumComputingSimulation()

# Create 5 qubits
simulation.create_qubits(5)

# Apply a Hadamard gate to the qubits
simulation.apply_quantum_gate("Hadamard")

# Measure the qubits
simulation.measure_qubits()