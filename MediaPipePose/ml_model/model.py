"""
Rep Counting Model Architecture
===============================
BiLSTM model for exercise rep counting from pose landmarks.
"""

import torch
import torch.nn as nn


class RepCountingModel(nn.Module):
    """
    BiLSTM model for rep counting.

    Input:  Sequence of pose landmarks (batch, seq_len, 99)
            33 landmarks × 3 coordinates (x, y, z)

    Output: Rep count (regression) + Exercise type (classification)
    """

    def __init__(
        self,
        input_dim: int = 99,  # 33 landmarks × 3 coords
        hidden_dim: int = 128,
        num_layers: int = 2,
        dropout: float = 0.3,
        num_exercises: int = 8,
        bidirectional: bool = True,
    ):
        super(RepCountingModel, self).__init__()

        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        self.bidirectional = bidirectional

        # Input projection
        self.input_proj = nn.Sequential(
            nn.Linear(input_dim, 64), nn.ReLU(), nn.Dropout(dropout)
        )

        # Temporal convolution for local patterns
        self.temporal_conv = nn.Sequential(
            nn.Conv1d(64, 64, kernel_size=3, padding=1),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Dropout(dropout),
        )

        # BiLSTM layers
        self.lstm = nn.LSTM(
            input_size=64,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0,
            bidirectional=bidirectional,
        )

        # Attention mechanism for focusing on key frames
        self.attention = nn.Sequential(
            nn.Linear(hidden_dim * 2 if bidirectional else hidden_dim, 64),
            nn.ReLU(),
            nn.Linear(64, 1),
        )

        # Rep counting head (regression)
        lstm_output_dim = hidden_dim * 2 if bidirectional else hidden_dim
        self.rep_head = nn.Sequential(
            nn.Linear(lstm_output_dim, 64),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1),  # Sigmoid for normalized count [0, 1]
            nn.Sigmoid(),
        )

        # Exercise classification head (optional, for multi-task learning)
        self.exercise_head = nn.Sequential(
            nn.Linear(lstm_output_dim, 64),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(64, num_exercises),
            nn.Softmax(dim=-1),
        )

    def forward(self, x: torch.Tensor, return_attention: bool = False):
        """
        Forward pass.

        Args:
            x: Input tensor (batch, seq_len, 99)
            return_attention: If True, return attention weights

        Returns:
            rep_count: Normalized rep count (batch, 1)
            exercise_logits: Exercise probabilities (batch, num_exercises)
        """
        batch_size, seq_len, _ = x.shape

        # Input projection
        x = self.input_proj(x)  # (batch, seq_len, 64)

        # Temporal convolution (need to transpose for Conv1d)
        x = x.transpose(1, 2)  # (batch, 64, seq_len)
        x = self.temporal_conv(x)
        x = x.transpose(1, 2)  # (batch, seq_len, 64)

        # LSTM
        lstm_out, _ = self.lstm(x)  # (batch, seq_len, hidden_dim * 2)

        # Attention mechanism
        attn_weights = self.attention(lstm_out)  # (batch, seq_len, 1)
        attn_weights = torch.softmax(attn_weights, dim=1)

        # Weighted sum of LSTM outputs
        context = torch.sum(lstm_out * attn_weights, dim=1)  # (batch, hidden_dim * 2)

        # Rep counting (denormalize by max expected reps)
        rep_count = self.rep_head(context) * 50  # Scale to max 50 reps

        # Exercise classification
        exercise_logits = self.exercise_head(context)

        if return_attention:
            return rep_count, exercise_logits, attn_weights

        return rep_count, exercise_logits


class LightweightRepModel(nn.Module):
    """
    Lightweight version for faster inference.
    Single-layer LSTM, fewer parameters.
    """

    def __init__(self, input_dim: int = 99, hidden_dim: int = 64):
        super(LightweightRepModel, self).__init__()

        self.lstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=hidden_dim,
            num_layers=1,
            batch_first=True,
            bidirectional=True,
        )

        self.rep_head = nn.Sequential(
            nn.Linear(hidden_dim * 2, 32), nn.ReLU(), nn.Linear(32, 1), nn.Sigmoid()
        )

    def forward(self, x: torch.Tensor):
        lstm_out, _ = self.lstm(x)
        # Use last timestep
        last_out = lstm_out[:, -1, :]
        rep_count = self.rep_head(last_out) * 50
        return rep_count


def count_parameters(model: nn.Module) -> int:
    """Count trainable parameters in model."""
    return sum(p.numel() for p in model.parameters() if p.requires_grad)


def get_model_summary(model: nn.Module, input_shape: tuple = (30, 99)):
    """Get model summary info."""
    total_params = count_parameters(model)

    x = torch.randn(1, *input_shape)
    with torch.no_grad():
        rep_out, exercise_out = model(x)

    return {
        "total_parameters": total_params,
        "input_shape": input_shape,
        "rep_output_shape": list(rep_out.shape),
        "exercise_output_shape": list(exercise_out.shape),
        "model_size_mb": total_params * 4 / (1024 * 1024),  # Assuming float32
    }


if __name__ == "__main__":
    # Test model
    model = RepCountingModel()
    summary = get_model_summary(model)

    print("=" * 50)
    print("Rep Counting Model Summary")
    print("=" * 50)
    print(f"Total Parameters: {summary['total_parameters']:,}")
    print(f"Model Size: ~{summary['model_size_mb']:.2f} MB")
    print(f"Input Shape: {summary['input_shape']}")
    print(f"Rep Output Shape: {summary['rep_output_shape']}")
    print(f"Exercise Output Shape: {summary['exercise_output_shape']}")
    print("=" * 50)
