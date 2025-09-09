import detectivePikachu from "../../data/pikachu.png";
import "../../css/NoResults.css";

export default function NoResults({ searchTerm, suggestion, onSuggestionClick }) {
    if (!searchTerm) return null;

    return (
        <div className="no-results-hint">
            <img
                src={detectivePikachu}
                alt="Detective Pikachu"
                className="no-results-img"
            />
            <p className="no-results-text">
                {searchTerm === "your search filters" 
                    ? "No Pokémon found with your search filters."
                    : <>No Pokémon found for <span className="no-results-term">"{searchTerm}"</span>.</>
                }
            </p>
            {suggestion && onSuggestionClick && (
                <p className="no-results-suggestion">
                    Did you mean{" "}
                    <button
                        className="no-results-button"
                        onClick={() => onSuggestionClick(suggestion)}
                    >
                        {suggestion}
                    </button>
                    ?
                </p>
            )}
        </div>
    );
} 
