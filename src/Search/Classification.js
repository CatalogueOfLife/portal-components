import React from "react";
import { LinkTo } from "../router";

const ranks = ["family", "superfamily", "order", "subclass", "class", "superclass", "subphylum", "phylum"];

export default ({ classification, maxParents = classification.length, truncate }) => {
    const clazzification = classification.slice(Math.max(classification.length - maxParents));
    if (truncate) {
        const classificationRankMap = classification.reduce((acc, curr) => (acc[curr.rank] = curr, acc), {});

        const kingdom = classificationRankMap["kingdom"];
        let familyOrClosestAlternative;
        for (let i = 0; i < ranks.length; i++) {
            if (classificationRankMap[ranks[i]]) {
                familyOrClosestAlternative = classificationRankMap[ranks[i]];
                break;
            }
        }
        if (kingdom && familyOrClosestAlternative) {
            return (
                <React.Fragment>
                    <LinkTo to="taxon" args={kingdom.id}>{kingdom.name}</LinkTo>
                    {familyOrClosestAlternative.rank === "phylum" ? " > " : " > ... > "}
                    <LinkTo to="taxon" args={familyOrClosestAlternative.id}>{familyOrClosestAlternative.name}</LinkTo>
                </React.Fragment>
            );
        } else if (kingdom) {
            return <LinkTo to="taxon" args={kingdom.id}>{kingdom.name}</LinkTo>;
        } else {
            return null;
        }
    } else {
        return clazzification.map((t, key) => (
            <React.Fragment key={key}>
                <LinkTo to="taxon" args={t.id}>{t.name}</LinkTo>
                {!Object.is(clazzification.length - 1, key) && " > "}
            </React.Fragment>
        ));
    }
};
