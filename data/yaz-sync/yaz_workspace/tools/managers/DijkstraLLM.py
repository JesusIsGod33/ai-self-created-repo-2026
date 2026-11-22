import sys
import heapq

def dijkstra(graph, start, end):
    queue = []
    heapq.heappush(queue, (0, start))
    distances = {node: float('infinity') for node in graph}
    distances[start] = 0
    shortest_path = {}
    
    while queue:
        current_distance, current_node = heapq.heappop(queue)
        
        if distances[current_node] < current_distance:
            continue
        
        for adjacent, weight in graph[current_node].items():
            distance = current_distance + weight
            
            if distance < distances[adjacent]:
                distances[adjacent] = distance
                heapq.heappush(queue, (distance, adjacent))
                shortest_path[adjacent] = current_node
                
    path = []
    while end:
        path.append(end)
        end = shortest_path.get(end)
        
    return path[::-1], distances

# Example graph representing a knowledge base
graph = {
    'A': {'B': 1, 'C': 3},
    'B': {'A': 1, 'C': 2, 'D': 4},
    'C': {'A': 3, 'B': 2, 'D': 1},
    'D': {'B': 4, 'C': 1}
}

start_node = 'A'
end_node = 'D'

path, distances = dijkstra(graph, start_node, end_node)
print(f"Shortest path from {start_node} to {end_node}: {path}")
print(f"Distances from {start_node}: {distances}")