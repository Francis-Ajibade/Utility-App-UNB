"""Rule 12: the one place that decides a product's status and its refill tasks.

Numbers in, answer out. No database, so the API, the dashboard, Teams alerts and
the assistant always agree, and it can be tested on its own.
"""

from dataclasses import dataclass
from typing import Literal

Status = Literal["out", "reorder", "refill", "ok"]


# What we need to know about the product.
@dataclass(frozen=True)
class Product:
    items_per_box: int
    refill_below: int  # items: a working shelf below this needs a box brought over
    reorder_below: int  # sealed boxes, across every place: below this, order more


# One place the product is kept (one stock row).
@dataclass(frozen=True)
class Place:
    id: str
    room: str
    spot: str
    bin: str | None
    kind: Literal["working", "reserve"]
    unopened_boxes: int
    items: int


# A shelf that needs refilling, and where to bring one box from.
@dataclass(frozen=True)
class RefillTask:
    place: Place  # the low shelf
    source: Place  # where the box comes from (Done = transfer 1 box from here)


def total(product: Product, places: list[Place]) -> int:
    """Every item the product has, everywhere: sealed boxes opened up, plus single items."""
    # TODO: add up unopened_boxes * items_per_box + items over all places
    raise NotImplementedError


def refill_tasks(product: Product, places: list[Place]) -> list[RefillTask]:
    """One task for each working shelf that is low and has no sealed box of its own.

    A working place needs a refill when all three are true:
      - its items are below refill_below
      - no sealed box at the same room and spot (any bin), so staff can't just open one
      - a sealed box exists somewhere else to bring over
    The source prefers a reserve place; among those, the one with the most boxes.
    """
    # TODO: work through each working place and decide if it is low
    # TODO: skip it if the same room and spot has a sealed box
    # TODO: pick the source: reserve places first, then the most boxes;
    #       never the same room and spot; skip the task if there is no source
    raise NotImplementedError


def status(product: Product, places: list[Place]) -> Status:
    """The product's single status, checked in this order: out > reorder > refill > ok."""
    # TODO: out: total is 0
    # TODO: reorder: sealed boxes summed over every place are below reorder_below
    # TODO: refill: there is at least one refill task
    # TODO: otherwise ok
    raise NotImplementedError
