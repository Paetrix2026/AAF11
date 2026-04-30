import shutil


def print_health_report() -> None:
    print("\n=== Healynx Backend Health Check ===")

    binaries = {
        "obabel": "Open Babel (SMILES/PDB conversion)",
        "vina": "AutoDock Vina (molecular docking)",
        "mafft": "MAFFT (sequence alignment)",
    }

    from utils.environment import get_binary_path
    for binary, description in binaries.items():
        path = get_binary_path(binary)
        if path:
            print(f"  [FOUND] {description}: {path}")
        else:
            print(f"  [MISSING] {description}: NOT FOUND (optional for demo)")

    print("===================================\n")
