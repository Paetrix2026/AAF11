import shutil
from typing import Optional


def find_binary(name: str) -> Optional[str]:
    from utils.environment import get_binary_path
    return get_binary_path(name)


def check_vina() -> bool:
    return find_binary("vina") is not None


def check_obabel() -> bool:
    return find_binary("obabel") is not None


def check_mafft() -> bool:
    return find_binary("mafft") is not None
