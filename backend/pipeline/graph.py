from langgraph.graph import StateGraph, END
from pipeline.state import PipelineState

# Import each agent module individually to avoid circular imports
import agents.PlannerAgent as PlannerAgent
import agents.FetchAgent as FetchAgent
import agents.MutationParserAgent as MutationParserAgent
import agents.StructurePrepAgent as StructurePrepAgent
import agents.DockingAgent as DockingAgent
import agents.ADMETAgent as ADMETAgent
import agents.ResistanceAgent as ResistanceAgent
import agents.SelectivityAgent as SelectivityAgent
import agents.SimilaritySearchAgent as SimilaritySearchAgent
import agents.ExplainabilityAgent as ExplainabilityAgent
import agents.ReportAgent as ReportAgent


def build_pipeline_graph() -> StateGraph:
    graph = StateGraph(PipelineState)

    graph.add_node("planner", PlannerAgent.run)
    graph.add_node("fetch", FetchAgent.run)
    graph.add_node("mutation_parser", MutationParserAgent.run)
    graph.add_node("structure_prep", StructurePrepAgent.run)
    graph.add_node("docking", DockingAgent.run)
    graph.add_node("admet", ADMETAgent.run)
    graph.add_node("resistance", ResistanceAgent.run)
    graph.add_node("selectivity", SelectivityAgent.run)
    graph.add_node("similarity_search", SimilaritySearchAgent.run)
    graph.add_node("explainability", ExplainabilityAgent.run)
    graph.add_node("report", ReportAgent.run)

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
