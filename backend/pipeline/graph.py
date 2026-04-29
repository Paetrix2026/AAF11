from langgraph.graph import StateGraph, END
from pipeline.state import PipelineState

# Import agents in pipeline order
from agents.PlannerAgent import run as planner_run
from agents.FetchAgent import run as fetch_run
from agents.MutationParserAgent import run as mutation_parser_run
from agents.StructurePrepAgent import run as structure_prep_run
from agents.DockingAgent import run as docking_run
from agents.ADMETAgent import run as admet_run
from agents.ResistanceAgent import run as resistance_run
from agents.SelectivityAgent import run as selectivity_run
from agents.SimilaritySearchAgent import run as similarity_search_run
from agents.ExplainabilityAgent import run as explainability_run
from agents.ReportAgent import run as report_run


def build_pipeline_graph() -> StateGraph:
    """
    Builds the Healynx agent pipeline following the strict execution order from CLAUDE.md:
    PlannerAgent → FetchAgent → MutationParserAgent → StructurePrepAgent → DockingAgent →
    ADMETAgent → ResistanceAgent → SelectivityAgent → SimilaritySearchAgent →
    ExplainabilityAgent → ReportAgent
    """
    graph = StateGraph(PipelineState)

    # Add Nodes
    graph.add_node("planner", planner_run)
    graph.add_node("fetch", fetch_run)
    graph.add_node("mutation_parser", mutation_parser_run)
    graph.add_node("structure_prep", structure_prep_run)
    graph.add_node("docking", docking_run)
    graph.add_node("admet", admet_run)
    graph.add_node("resistance", resistance_run)
    graph.add_node("selectivity", selectivity_run)
    graph.add_node("similarity_search", similarity_search_run)
    graph.add_node("explainability", explainability_run)
    graph.add_node("report", report_run)

    # Define strict execution order
    graph.set_entry_point("planner")
    graph.add_edge("planner", "fetch")
    graph.add_edge("fetch", "mutation_parser")
    graph.add_edge("mutation_parser", "structure_prep")
    graph.add_edge("structure_prep", "docking")
    graph.add_edge("docking", "admet")
    graph.add_edge("admet", "resistance")
    graph.add_edge("resistance", "selectivity")
    graph.add_edge("selectivity", "similarity_search")
    graph.add_edge("similarity_search", "explainability")
    graph.add_edge("explainability", "report")
    graph.add_edge("report", END)

    return graph.compile()
