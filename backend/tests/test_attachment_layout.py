"""Where a platform file is filed and what it is called: the grouped tree, the
self-describing name, and the rule that tells a new version from a new document.

Pure — no database, no storage — so it runs anywhere pytest does.
"""

from __future__ import annotations

import pytest

from sourcehub.modules.attachments.folders import Filing, next_numbers, stored_name, subfolder

BASE = "Acme Retail Analytics/RFP-1001"
REQUEST = Filing(base=BASE, rfp_ref="RFP-1001", scope_ref=None, scope_label=None)
PROPOSAL = Filing(
    base=BASE, rfp_ref="RFP-1001", scope_ref="PRO-03",
    scope_label="TN-01 NorthStar Delivery Partners",
)
TASK = Filing(base=BASE, rfp_ref="RFP-1001", scope_ref="TSK-02", scope_label=None)


# --- the tree ----------------------------------------------------------------

def test_the_clients_own_documents_file_under_request():
    assert subfolder("request", REQUEST, "brief") == "request/brief"
    assert subfolder("request", REQUEST, "capture_examples") == "request/capture_examples"


def test_each_bid_gets_its_own_folder_named_for_the_bidder():
    assert subfolder("proposal", PROPOSAL, "methodology") == (
        "proposals/PRO-03 TN-01 NorthStar Delivery Partners/methodology"
    )


def test_two_tasks_can_no_longer_share_an_instructions_folder():
    other = Filing(base=BASE, rfp_ref="RFP-1001", scope_ref="TSK-05", scope_label=None)
    assert subfolder("task", TASK, "instructions") == "tasks/TSK-02/instructions"
    assert subfolder("task", other, "instructions") == "tasks/TSK-05/instructions"


def test_qa_evidence_files_under_the_task_it_judges():
    assert subfolder("qa_review", TASK, "verdict") == "qa/TSK-02/verdict"


def test_a_bidder_name_cannot_smuggle_a_path_separator_into_the_tree():
    sly = Filing(
        base=BASE, rfp_ref="RFP-1001", scope_ref="PRO-09", scope_label="TN-04 A/B: Imaging",
    )
    assert subfolder("proposal", sly, "methodology") == (
        "proposals/PRO-09 TN-04 A-B- Imaging/methodology"
    )


# --- the name ----------------------------------------------------------------

def test_the_documented_examples():
    assert stored_name("RFP-1001", None, "brief", 1, 1, "Laptop_Purchase_Sheet.docx") == (
        "RFP-1001_brief_01_v1_Laptop_Purchase_Sheet.docx"
    )
    assert stored_name("RFP-1001", "PRO-03", "methodology", 1, 1, "Method_Statement.pdf") == (
        "RFP-1001_PRO-03_methodology_01_v1_Method_Statement.pdf"
    )
    assert stored_name("RFP-1001", "TSK-02", "instructions", 1, 1, "Shot_List.docx") == (
        "RFP-1001_TSK-02_instructions_01_v1_Shot_List.docx"
    )


def test_a_revision_differs_only_by_its_version():
    v1 = stored_name("RFP-1001", None, "compliance", 1, 1, "DPA.pdf")
    v2 = stored_name("RFP-1001", None, "compliance", 1, 2, "DPA.pdf")
    assert (v1, v2) == ("RFP-1001_compliance_01_v1_DPA.pdf", "RFP-1001_compliance_01_v2_DPA.pdf")


def test_whitespace_in_the_original_becomes_underscores():
    assert stored_name("RFP-1001", None, "brief", 2, 1, "Laptop Purchase  Sheet (1).docx") == (
        "RFP-1001_brief_02_v1_Laptop_Purchase_Sheet_(1).docx"
    )


def test_numbers_sort_correctly_in_a_listing():
    names = [stored_name("RFP-1001", None, "brief", n, 1, "x.pdf") for n in (10, 2, 1)]
    assert sorted(names) == [
        "RFP-1001_brief_01_v1_x.pdf", "RFP-1001_brief_02_v1_x.pdf", "RFP-1001_brief_10_v1_x.pdf",
    ]


# --- a new version, or a new document? ---------------------------------------

def test_the_first_file_in_a_slot_is_document_one_version_one():
    assert next_numbers([], "DPA.pdf") == (1, 1)


def test_the_same_filename_again_is_the_next_version():
    assert next_numbers([(1, 1, "DPA.pdf")], "DPA.pdf") == (1, 2)
    assert next_numbers([(1, 1, "DPA.pdf"), (1, 2, "DPA.pdf")], "DPA.pdf") == (1, 3)


def test_a_different_filename_is_the_next_document():
    assert next_numbers([(1, 1, "DPA.pdf")], "Brief.docx") == (2, 1)
    assert next_numbers([(1, 1, "DPA.pdf"), (2, 1, "Brief.docx")], "Annex.pdf") == (3, 1)


def test_filenames_match_case_insensitively():
    assert next_numbers([(1, 1, "DPA.pdf")], "dpa.PDF") == (1, 2)


def test_a_removed_version_is_never_handed_out_again():
    # `existing` includes soft-deleted rows: v2 was removed, the next is v3.
    assert next_numbers([(1, 1, "DPA.pdf"), (1, 2, "DPA.pdf")], "DPA.pdf") == (1, 3)


def test_a_removed_document_number_is_never_handed_out_again():
    # document 2 was removed entirely; a new file is document 3, not a second 2
    assert next_numbers([(1, 1, "a.pdf"), (2, 1, "b.pdf")], "c.pdf") == (3, 1)


def test_revising_an_early_document_does_not_disturb_later_ones():
    existing = [(1, 1, "a.pdf"), (2, 1, "b.pdf"), (3, 1, "c.pdf")]
    assert next_numbers(existing, "a.pdf") == (1, 2)


@pytest.mark.parametrize("slot", ["brief", "compliance"])
def test_numbering_is_per_slot_because_the_caller_passes_one_slot(slot: str):
    # next_numbers sees only the rows of ONE parent+slot; an empty slot starts at 1
    assert next_numbers([], f"{slot}.pdf") == (1, 1)
