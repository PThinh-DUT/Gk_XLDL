"""LeNet-5 (LeCun et al., 1998) — phiên bản hiện đại dùng ReLU + MaxPool.

conv1 5x5, 6 kênh (padding 2) -> ReLU -> MaxPool 2
conv2 5x5, 16 kênh            -> ReLU -> MaxPool 2
fc1 400->120 -> ReLU -> fc2 120->84 -> ReLU -> fc3 84->10
Tổng 61 706 tham số.
"""
import torch
import torch.nn as nn
import torch.nn.functional as F


class LeNet5(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(1, 6, 5, padding=2)
        self.conv2 = nn.Conv2d(6, 16, 5)
        self.fc1 = nn.Linear(16 * 5 * 5, 120)
        self.fc2 = nn.Linear(120, 84)
        self.fc3 = nn.Linear(84, 10)

    def forward(self, x):
        x = F.max_pool2d(F.relu(self.conv1(x)), 2)
        x = F.max_pool2d(F.relu(self.conv2(x)), 2)
        x = x.flatten(1)
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        return self.fc3(x)


LAYERS = ["conv1", "conv2", "fc1", "fc2", "fc3"]


@torch.no_grad()
def evaluate(model, x, y, batch=2000):
    model.eval()
    correct = 0
    for i in range(0, len(x), batch):
        correct += (model(x[i:i + batch]).argmax(1) == y[i:i + batch]).sum().item()
    return 100.0 * correct / len(x)
