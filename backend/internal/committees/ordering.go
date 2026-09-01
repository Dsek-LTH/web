package committees

import "sort"

// Hand-curated editorial display order for positions within a committee (or
// on the board page), ported verbatim from
// src/lib/utils/committee-ordering/{enums,sort}.ts. There is no backing DB
// column for this - it's genuine business/editorial data (who's listed
// first), not derived from anything queryable. Position IDs not present in
// the relevant table are left in their original (query) order, matching
// the old comparePositions' "preserve order if undefined" behavior.

var boardOrder = []string{
	"dsek.ordf",
	"dsek.vice_ordf",
	"dsek.skattm.mastare",
	"dsek.infu.mastare",
	"dsek.srd.ordf",
	"dsek.cafe.mastare",
	"dsek.nari.mastare",
	"dsek.km.mastare",
	"dsek.aktu.mastare",
	"dsek.sex.mastare",
	"dsek.noll.stab.oph",
}

var committeeOrder = map[string][]string{
	"other": {
		"dsek.ordf", "dsek.vice_ordf", "dsek.revisor", "dsek.talman",
		"dsek.tlthvalnrep", "dsek.juble.gen", "dsek.juble.mastare",
	},
	"skattm": {
		"dsek.skattm.mastare", "dsek.skattm.vice_mastare", "dsek.skattm.fm", "dsek.skattm.funk",
	},
	"infu": {
		"dsek.infu.mastare", "dsek.infu.vice_mastare", "dsek.infu.dwww.mastare",
		"dsek.infu.dwww.mdlm", "dsek.infu.webmaster", "dsek.infu.fotograf",
		"old.dsek.infu.fotografdammig", "dsek.infu.filmare", "dsek.infu.artist",
		"dsek.infu.arkivarie", "dsek.infu.redaktor", "dsek.infu.journalist",
		"dsek.infu.influencer", "dsek.infu.shopaholic", "dsek.infu.markv",
		"dsek.infu.skald", "old.dsek.infu.readmeredaktos", "old.dsek.infu.ddu",
		"old.dsek.infu.wdredaktör", "old.dsek.vdredaktor", "old.dsek.infu.chefredaktör",
		"old.dsek.infu.redaktör", "dsek.infu.funk",
	},
	"srd": {
		"dsek.srd.ordf", "dsek.srd.vice_ordf", "dsek.srd.srdsekreterare",
		"old.dsek.srd.arskursrepresentant", "old.dsek.srd.kurskommissarie",
		"old.dsek.srd.vicekurskommissarie", "old.dsek.srd.kursombudsansvarig",
		"old.dsek.srd.infotlth", "dsek.srd.instledrep", "dsek.srd.progledrep",
		"dsek.srd.husrepresentant", "old.dsek.srd.skyddskommitterepresentant",
		"old.dsek.srd.kinaansvarig", "dsek.srd.arskursrep.d1", "dsek.srd.arskursrep.c1",
		"dsek.srd.arskursrep.d2", "dsek.srd.arskursrep.c2", "dsek.srd.arskursrep.d3",
		"dsek.srd.arskursrep.c3", "dsek.srd.funk",
	},
	"cafe": {
		"dsek.cafe.mastare", "dsek.cafe.vice_mastare", "dsek.cafe.dagsansv",
		"dsek.cafe.inventarieansv", "dsek.cafe.brunchansv", "dsek.cafe.stekare", "dsek.cafe.funk",
	},
	"naru": {
		"dsek.nari.mastare", "old.dsek.nari.industrikontaktman", "dsek.nari.vice_mastare",
		"old.dsek.viceindustrikontakt", "dsek.delta.projgr.general", "dsek.delta.projgr.mdlm",
		"dsek.teknik.projgr.ansv", "dsek.teknik.projgr.mdlm", "dsek.nari.mentorsansv",
		"dsek.nari.alu.ansv", "dsek.nari.alu.mdlm", "dsek.delta.vard", "dsek.nari.funk",
	},
	"km": {
		"dsek.km.mastare", "dsek.km.vice_mastare", "old.dsek.km.utflippadvicemastare",
		"dsek.km.rootm.root", "old.dsek.km.rootm.root", "dsek.km.rootm.vice_root",
		"dsek.km.rootm.sudo", "dsek.km.rootm.sparky", "dsek.km.ljudoljus", "dsek.km.bilansv",
		"dsek.km.tradgmstr", "old.dsek.km.sektionslivskvalitetsforhöjare", "dsek.km.funk",
	},
	"aktu": {
		"dsek.aktu.mastare", "dsek.aktu.vice_mastare", "dsek.aktu.dischoansv",
		"dsek.aktu.idrottsfm", "dsek.aktu.dsportare", "dsek.aktu.karnevalsansv",
		"dsek.aktu.lanpartyansv", "dsek.aktu.sangstfm", "dsek.aktu.tandemgen",
		"dsek.aktu.semester", "dsek.aktu.markv", "dsek.aktu.vrdansansv",
		"dsek.aktu.smmstr", "dsek.aktu.funk",
	},
	"sexm": {
		"dsek.sex.mastare", "dsek.sex.vice_mastare", "dsek.sex.hov.mstr", "dsek.sex.hov.sangfm",
		"dsek.sex.pub.mastare", "dsek.sex.pub.vice_mastare", "dsek.sex.bar.mstr",
		"old.dsek.sex.bartenders", "dsek.sex.bar.vice_mstr", "dsek.sex.kok.mstr",
		"dsek.sex.kok.vice_mstr", "dsek.sex.kok.prefmstr", "dsek.sex.olfm", "dsek.sex.vinfm",
		"dsek.sex.sektkock", "dsek.sex.funk",
	},
	"nollu": {
		"dsek.noll.stab.oph", "old.dsek.noll.stab.oph", "dsek.noll.stab.mdlm",
		"old.dsek.nollu.staben", "dsek.noll.pepp.op", "dsek.noll.pepp.p",
		"dsek.noll.phadder", "dsek.noll.funk", "dsek.noll.uppdrag", "dsek.noll.pluggphadder",
	},
	"fram": {"dsek.fram.ordf", "dsek.fram.ledamot"},
	"dchip": {
		"dchip.ordf", "dchip.vice_ordf", "dchip.sekr", "dchip.revisor", "dchip.ekonomi",
		"dchip.infoansv", "dchip.nara", "dchip.event", "dchip.styrelse", "dchip.valb", "dchip.funk",
	},
	"medalj": {
		"dsek.overmarskalk", "dsek.inspektor", "dsek.medalj.mdlm", "dsek.medalj.funk",
	},
	"trivsel": {
		"dsek.triv.mastare", "dsek.triv.likbehombud", "dsek.triv.skyddsombud",
		"dsek.triv.varldsmstr", "dsek.triv.htf",
	},
	"valb":  {"dsek.val.ordf", "dsek.val.rep"},
	"tackm": {"dsek.tackm.mastare", "dsek.tackm.mdlm"},
	"cpu": {
		"dsek.cpu.mastare", "dsek.cpu.vice_mastare", "dsek.cpu.dwwwansv",
		"dsek.cpu.root", "dsek.cpu.utvecklare", "dsek.cpu.funk",
	},
}

func indexOf(order []string, id string) (int, bool) {
	for i, v := range order {
		if v == id {
			return i, true
		}
	}
	return 0, false
}

// sortByOrder stably sorts positions in place per order, leaving positions
// absent from order in their original relative position (query order). id
// extracts a position's ID - generic over both bare Position (committee
// list) and the richer PositionDetail (committee/position detail), which
// can't share a method-based constraint since Position is a type alias for
// apitypes.Position and Go forbids defining methods on aliased external
// types.
func sortByOrder[T any](positions []T, order []string, id func(T) string) {
	sort.SliceStable(positions, func(i, j int) bool {
		iIdx, iOk := indexOf(order, id(positions[i]))
		jIdx, jOk := indexOf(order, id(positions[j]))
		if !iOk || !jOk {
			return false
		}
		return iIdx < jIdx
	})
}

// SortBoardPositions sorts board-flagged positions per the hand-curated
// board display order.
func SortBoardPositions[T any](positions []T, id func(T) string) {
	sortByOrder(positions, boardOrder, id)
}

// SortCommitteePositions sorts a committee's positions per its own
// hand-curated order, if one exists for committeeShortName - a committee
// with no entry in committeeOrder keeps its query order entirely.
func SortCommitteePositions[T any](positions []T, committeeShortName string, id func(T) string) {
	order, ok := committeeOrder[committeeShortName]
	if !ok {
		return
	}
	sortByOrder(positions, order, id)
}
